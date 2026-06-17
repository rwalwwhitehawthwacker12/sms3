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

        // Numarayı formatla (sadece rakam)
        phone = phone.replace(/\s/g, '').replace(/[^0-9]/g, '');
        if (!phone.startsWith('90') && phone.length === 10) {
            phone = '90' + phone;
        }
        if (phone.startsWith('90')) {
            phone = phone.replace(/^90/, '');
        }

        const code = Math.floor(1000 + Math.random() * 9000);

        // TextBelt (Günde 1 SMS ücretsiz)
        const response = await fetch('https://textbelt.com/text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                phone: phone,
                message: `Onay kodunuz: ${code}`,
                key: 'textbelt'
            })
        });

        const data = await response.json();

        if (data.success) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: '✅ SMS gönderildi! (TextBelt - 1/gün)',
                    code: code
                })
            };
        } else {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '❌ TextBelt hatası: ' + (data.error || 'Bilinmeyen hata')
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
