const { StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const signer = require('node-signpdf');
const {
    PDFDocument,
    PDFName,
    PDFNumber,
    PDFHexString,
    PDFString,
} = require('pdf-lib');

const SIGNATURE_LENGTH = 5540;
const PDFArrayCustom = require('../utils/PDFArrayCustom');
const { eraseDirectory } = require('../utils/files');

const mimePFXfile = 'application/x-pkcs12';
const mimeP12file = 'application/pkcs12';
const mimePDFFile = 'application/pdf';

const eSignDocs = async (file, pswd, certificate) => {
    const pdfBuffer = fs.readFileSync(file.path);
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    const signatureFieldName = 'Documento assinado digitalmente por INSTITUTO DO CANCER DE LONDRINA';

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { height } = firstPage.getSize()

    firstPage.drawText(signatureFieldName, {
        x: 1,
        y: height - 8,
        size: 7,
        font: helveticaFont,
        color: rgb(0.128, 0.128, 0.128),
    });

    pdfDoc.save({ useObjectStreams: false });

    const ByteRange = PDFArrayCustom.withContext(pdfDoc.context);
    ByteRange.push(PDFNumber.of(0));
    ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER));
    ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER));
    ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER));

    const signatureDict = pdfDoc.context.obj({
        Type: 'Sig',
        Filter: 'Adobe.PPKLite',
        SubFilter: 'adbe.pkcs7.detached',
        ByteRange,
        Contents: PDFHexString.of('A'.repeat(SIGNATURE_LENGTH)),
        Reason: PDFString.of('We need your signature for reasons...'),
        M: PDFString.fromDate(new Date()),
    });
    const signatureDictRef = pdfDoc.context.register(signatureDict);

    const widgetDict = pdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Widget',
        FT: 'Sig',
        Rect: [0, 0, 0, 0],
        V: signatureDictRef,
        T: PDFString.of('Signature1'),
        F: 4,
        P: pages[0].ref,
    });
    const widgetDictRef = pdfDoc.context.register(widgetDict);

    // Add our signature widget to the first page
    pages[0].node.set(PDFName.of('Annots'), pdfDoc.context.obj([widgetDictRef]));

    // Create an AcroForm object containing our signature widget
    pdfDoc.catalog.set(
        PDFName.of('AcroForm'),
        pdfDoc.context.obj({
            SigFlags: 3,
            Fields: [widgetDictRef],
        }),
    );

    const modifiedPdfBytes = await pdfDoc.save({ useObjectStreams: false });
    const modifiedPdfBuffer = Buffer.from(modifiedPdfBytes);

    const signObj = new signer.SignPdf();
    const signedPdfBuffer = signObj.sign(modifiedPdfBuffer, certificate, {
        passphrase: pswd,
    });

    // Write the signed file
    fs.writeFileSync(`./signed/${file.originalname}`, signedPdfBuffer);
}

const multipleUpload = async (req, res) => {
    const certificate = [];
    const pdfs = [];
    const pswd = req.body.password;

    try {
        req.files.map(file => {
            if (file.mimetype === mimePDFFile) {
                pdfs.push(file)
            }

            if (file.mimetype === mimeP12file || file.mimetype === mimePFXfile) {
                certificate.push(file)
            }
        })
    } catch (error) {
        console.log(error)
    }

    const certificateBuffer = fs.readFileSync(certificate[0].path);

    try {
        pdfs.forEach(async pdf => await eSignDocs(pdf, pswd, certificateBuffer));
    } catch (error) {
        console.log(error);
    }

    await eraseDirectory('./temp-files');

    res.send('OK')
}

module.exports = {
    multipleUpload
}
