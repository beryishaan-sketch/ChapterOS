const QRCode = require('qrcode');

const generateQRCode = async (data) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#0F1C3F',
        light: '#FFFFFF',
      },
    });
    return { success: true, dataUrl: qrDataUrl };
  } catch (error) {
    console.error('QR code generation error:', error);
    return { success: false, error: error.message };
  }
};

const generateEventQRCode = async (eventId) => {
  const checkInUrl = `${process.env.FRONTEND_URL}/checkin/${eventId}`;
  return generateQRCode(checkInUrl);
};

module.exports = { generateQRCode, generateEventQRCode };
