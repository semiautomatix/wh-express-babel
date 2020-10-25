import request from 'request';
import fs from 'fs';

export const generatePDF = (zpl: string) => new Promise((resolve, reject) => {
  const options = {
    // @ts-ignore
    encoding: null, // will only work if null, undefined does not work!
    formData: { file: zpl },
    headers: { 'Accept': 'application/pdf' }, // omit this line to get PNG images back
    url: 'http://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/'
  };

  request.post(options, function (err, resp, body) {
    if (err) {
      return console.log(err);
    }

    resolve(body);
  });
});
