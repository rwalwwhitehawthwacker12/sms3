exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }

    try {
        let { phone } = JSON.parse(event.body);

        // ============================================================
        // NUMARAYI FORMATLA (Twilio + ile istiyor)
        // ============================================================
        phone = phone.replace(/\s/g, '').replace(/[^0-9]/g, '');

        // Türkiye numaraları için (90 ile başlamıyorsa ekle)
        if (!phone.startsWith('90') && phone.length === 10) {
            phone = '90' + phone;
        }

        // Twilio formatı: +90...
        const formattedPhone = '+' + phone;

        // ============================================================
        // NETLİFY ENV DEĞİŞKENLERİ
        // ============================================================
        const accountSid = process.env.TWILIO_SID;
        const authToken = process.env.TWILIO_TOKEN;
        const fromNumber = process.env.TWILIO_FROM;

        const missing = [];
        if (!accountSid) missing.push('TWILIO_SID');
        if (!authToken) missing.push('TWILIO_TOKEN');
        if (!fromNumber) missing.push('TWILIO_FROM');

        if (missing.length > 0) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: `Eksik değişkenler: ${missing.join(', ')}`
                })
            };
        }

        const code = Math.floor(1000 + Math.random() * 9000);

        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
                },
                body: new URLSearchParams({
                    To: formattedPhone,
                    From: fromNumber,
                    Body: `Onay kodunuz: ${code}`
                })
            }
        );

        const data = await response.json();

        if (data.sid) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: '✅ SMS gönderildi! (Twilio)',
                    code: code
                })
            };
        } else {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '❌ Twilio hatası: ' + (data.message || 'Bilinmeyen hata')
                })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Sunucu hatası: ' + error.message
            })
        };
    }
};
