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
        const { phone } = JSON.parse(event.body);
        
        // 1. TELEFON NUMARASI KONTROLÜ
        if (!phone || phone.length < 10) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, message: 'Geçersiz numara!' })
            };
        }

        // 2. BİLGİLERİ NETLİFY ORTAM DEĞİŞKENLERİNDEN AL (GÜVENLİ!)
        const accountSid = process.env.TWILIO_SID;
        const authToken = process.env.TWILIO_TOKEN;
        const fromNumber = process.env.TWILIO_FROM;

        // 3. EĞER BİLGİLER AYARLANMAMIŞSA UYARI VER
        if (!accountSid || !authToken || !fromNumber) {
            console.error("Twilio bilgileri Netlify'da ayarlanmamış!");
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Sunucu yapılandırma hatası. Lütfen yönetici ile iletişime geçin.' 
                })
            };
        }

        const code = Math.floor(1000 + Math.random() * 9000);

        // 4. TWILIO İSTEĞİNİ GÖNDER
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
                },
                body: new URLSearchParams({
                    To: phone,
                    From: fromNumber,
                    Body: `Onay kodunuz: ${code}`
                })
            }
        );

        const data = await response.json();

        // 5. SONUCU DÖNDÜR
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
        console.error("Function hatası:", error);
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

