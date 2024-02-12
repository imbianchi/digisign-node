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
const PDFArrayCustom = require('./PDFArrayCustom');

const eSignDocs = async (filePath, pswd, certificate, dirRoot) => {
    const certificateBuffer = fs.readFileSync(certificate);

    try {
        const pdfBuffer = fs.readFileSync(path.join('temp-files', dirRoot, filePath));
        const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

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

        pages[0].node.set(PDFName.of('Annots'), pdfDoc.context.obj([widgetDictRef]));

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
        let signedPdfBuffer;

        try {
            signedPdfBuffer = signObj.sign(modifiedPdfBuffer, certificateBuffer, {
                passphrase: pswd,
            })
        } catch (error) {
            throw error;
        }

        try {
            console.log('filePath:', `signed/${dirRoot}/${filePath}`);
            fs.writeFileSync(`signed/${dirRoot}/${filePath}`, signedPdfBuffer,  { recursive: true });
        } catch (error) {
            console.error('Error writing file:', error);
        }

    } catch (error) {
        const err = error.toString()
        if (err.includes('Invalid password')) {
            throw Error('Password inválido');
        }
    }
}

module.exports = {
    eSignDocs,
}