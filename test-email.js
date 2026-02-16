const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  try {
    console.log('📧 Testing email service...\n');
    
    console.log('Configuration:');
    console.log('  EMAIL_USER:', process.env.EMAIL_USER);
    console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set (' + process.env.EMAIL_PASS.substring(0, 4) + '...)' : '❌ Not set');
    console.log('  Nodemailer version:', require('nodemailer/package.json').version);
    console.log('');
    
    // Remove spaces from password
    const emailPass = process.env.EMAIL_PASS.replace(/\s/g, '');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: emailPass
      }
    });
    
    console.log('Sending test email...');
    
    const info = await transporter.sendMail({
      from: {
        name: 'BookMyHall',
        address: process.env.EMAIL_USER
      },
      to: process.env.EMAIL_USER,
      subject: '✅ Test Email - BookMyHall Email Service',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>✅ Email Service Working!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Congratulations! Your email service is configured correctly.</p>
            <p><strong>Email Configuration:</strong></p>
            <ul>
              <li>Email: ${process.env.EMAIL_USER}</li>
              <li>Service: Gmail</li>
              <li>Status: ✅ Working</li>
            </ul>
            <p>You will now receive email notifications when customers book your halls!</p>
          </div>
        </div>
      `,
      text: 'Email service is working! You will receive notifications when customers book your halls.'
    });
    
    console.log('\n✅ SUCCESS!');
    console.log('   Message ID:', info.messageId);
    console.log('   Email sent to:', process.env.EMAIL_USER);
    console.log('\n📬 Check your inbox (or spam folder) for the test email!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nPossible issues:');
    console.error('1. App Password is incorrect');
    console.error('2. 2-Step Verification not enabled');
    console.error('3. Internet connection issue');
    console.error('4. Gmail account issue');
    console.error('\nFull error:', error);
  }
}

testEmail();
