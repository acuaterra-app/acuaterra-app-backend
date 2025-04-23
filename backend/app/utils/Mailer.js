const { Resend } = require('resend');

class Mailer {
    constructor(apiKey) {
        this.resend = new Resend(apiKey);
    }

    /**
     * Sends an email using Resend
     * @param {string} to - Recipient email address
     * @param {string} subject - Email subject
     * @param {string} content - Email content (HTML supported)
     * @param {string} from - Sender email address (optional)
     * @returns {Promise} - Promise that resolves with the result of the email sending
     */
    async sendEmail(to, subject, content, from) {
        try {
            const data = await this.resend.emails.send({
                from,
                to,
                subject,
                html: content
            });

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Error sending email:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = Mailer;
