'use strict';

var async = require('async');
var AWS = require('aws-sdk');

function writeJSONToS3(bucket, key, obj, callback){
    var s3 = new AWS.S3();
    var buf = Buffer.from(JSON.stringify(obj));

    async.series(
      [
        function(cb) {
            s3.putObject({
                Bucket: bucket,
                Key: key,
                Body : buf
            }, cb);
        },
        function(cb) {
            s3.putObjectAcl({
                Bucket: bucket,
                Key: key,
                ACL: "public-read"
            }, cb);
        }
      ],
      callback
    );


}

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
    });

    var dateString = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    var backupFilename = "data/backup-" + dateString + ".json";
    var filename = "data/latest.json";
    var data = JSON.parse(event.body);
    var bucketName = process.env.S3_BUCKET;
    filename = "data/test.json";

    switch (event.httpMethod) {
        case 'POST':
        case 'PUT':

            async.parallel(
                [
                    function(cb) {
                        writeJSONToS3(bucketName, backupFilename, data, cb);
                    },
                    function(cb) {
                        writeJSONToS3(bucketName, filename, data, cb);
                    }
                ],
                done
            );

            break;
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};
