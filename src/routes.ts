import { Router } from 'express';
import uuidv4 from 'uuid/v4';
import fs, { promises as pfs } from 'fs';
import moment from 'moment';

import { generatePDF } from './services/labelary';

import documents, { IDocument } from './models/documents';

const routes = Router();

/**
 * GET home page
 */
routes.get('/', (req, res) => {
  res.render('index', { title: 'Express Babel' });
});

/**
 * GET /list
 *
 * This is a sample route demonstrating
 * a simple approach to error handling and testing
 * the global error handler. You most certainly want to
 * create different/better error handlers depending on
 * your use case.
 */
routes.get('/list', (req, res, next) => {
  const { title } = req.query;

  if (title == undefined || title === '') {
    // You probably want to set the response HTTP status to 400 Bad Request
    // or 422 Unprocessable Entity instead of the default 500 of
    // the global error handler (e.g check out https://github.com/kbariotis/throw.js).
    // This is just for demo purposes.
    next(new Error('The "title" parameter is required'));
    return;
  }

  res.render('index', { title });
});

routes.post('/labelary', async (req, res, next) => {
  const zpl = req.body.file;
  res.setHeader('Content-type', 'application/pdf');
  res.send(await generatePDF(zpl));
});

routes.get('/documents/:document_id', async (req: any, res, next) => {
  try {
    const { document_id } = req.params;
    const result: any = await documents.findById(document_id);

    const { filePath, fileName, contentType } = result;

    const basePath = `${process.env.FILE_STORAGE || __dirname + '/public/'}`;

    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    const stream = fs.createReadStream(`${basePath}${filePath}`);

    stream.on('error', function(error) {
        res.writeHead(404, 'Not Found');
        res.end();
    });

    stream.pipe(res);
  } catch (err) {
    res.status(500).send(err);
  }
});

routes.post('/uploads', async (req: any, res, next) => {
  const { data, name, mimetype } = req.files.filepond;

  // could be an S3 bucket
  // const filepath = `${__dirname}/public/${uuidv4()}_${name}`;
  // const filepath = `${process.env.FILE_STORAGE || __dirname + '/public/'}/${uuidv4()}_${name}`;
  const basePath = `${process.env.FILE_STORAGE || __dirname + '/public/'}/`;

  try {
    await pfs.readdir(`${basePath}/${moment().format('YYYY')}`);
  } catch (err) {
    await pfs.mkdir(`${basePath}/${moment().format('YYYY')}`);
  }
  try {
    await pfs.readdir(`${basePath}/${moment().format('YYYY')}/${moment().format('MM')}`);
  } catch (err) {
    await pfs.mkdir(`${basePath}/${moment().format('YYYY')}/${moment().format('MM')}`);
  }
  const filepath = `/${moment().format('YYYY')}/${moment().format('MM')}/${uuidv4()}_${name}`;
  /*data.mv(`${__dirname}/public/${filename}`, (err) => {
    if (err) {
      res.status(500).send(err);
      return;
    }

    res.json({
      file: `public/${filename}`,
      fileName: name,
      mimetype
    });
  });*/
 /* try {
    await fs.createWriteStream(filepath).pipe(data);
    res.json({
      file: filepath,
      fileName: name,
      mimetype
    });
  } catch (err) {
    res.status(500).send(err);
  }*/

  // This opens up the writeable stream to `output`
  /*var writeStream = fs.createWriteStream(filepath);

  // This pipes the POST data to the file
  data.pipe(writeStream);

  // After all the data is saved, respond with a simple html form so they can post more data
  data.on('end', function () {
    res.json({
      file: filepath,
      fileName: name,
      mimetype
    });
  });

  // This is here incase any errors occur
  writeStream.on('error', function (err) {
    res.status(500).send(err);
  });*/

  try {
    await pfs.writeFile(`${basePath}${filepath}`, data);
    res.json({
      path: filepath,
      name: name,
      mimetype
    });
  } catch (err) {
    res.status(500).send(err);
  }


  // res.send();
});

export default routes;
