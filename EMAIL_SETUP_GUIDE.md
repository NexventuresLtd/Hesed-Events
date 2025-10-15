# Email Configuration Guide for Hesed Events

## Quick Setup

### Step 1: Update `.env` file in backend folder

Create or update the `.env` file in your `backend` directory with these settings:

```env
# Email Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
SITE_URL=http://localhost:5173
```

---

## For Gmail Users

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Click "Security" in the left sidebar
3. Under "Signing in to Google", click "2-Step Verification"
4. Follow the prompts to enable 2FA

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other" as the device and name it "Hesed Events"
4. Click "Generate"
5. Copy the 16-character password (remove spaces)
6. Use this password in `EMAIL_HOST_PASSWORD` in your `.env` file

### Example Configuration:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=myemail@gmail.com
EMAIL_HOST_PASSWORD=abcderfghijklmnop
DEFAULT_FROM_EMAIL=myemail@gmail.com
SITE_URL=http://localhost:5173
```

---

## For Other Email Providers

### Microsoft Outlook / Office 365:

```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@outlook.com
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=your-email@outlook.com
```

### Yahoo Mail:

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@yahoo.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@yahoo.com
```

(Yahoo also requires app passwords)

### Custom SMTP Server:

```env
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@yourdomain.com
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

---

## Testing Email Configuration

### Step 1: Restart Backend Server

After updating `.env`:

```bash
cd backend
# Stop the server (Ctrl+C)
# Start again
uv run manage.py runserver
```

### Step 2: Test by Assigning a Task

1. Log in to your application
2. Go to Projects page
3. Create or edit a task
4. Assign it to a user with a valid email
5. Check the user's email inbox

### Step 3: Check Console for Errors

If emails aren't sending, check the backend console for error messages like:

- Authentication failed
- Connection refused
- Invalid credentials

---

## Production Recommendations

### Use a Dedicated Email Service

For production, consider using professional email services:

1. **SendGrid** (Free tier: 100 emails/day)

   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_HOST_USER=apikey
   EMAIL_HOST_PASSWORD=your-sendgrid-api-key
   ```

2. **Amazon SES** (Very affordable)

   ```env
   EMAIL_HOST=email-smtp.region.amazonaws.com
   EMAIL_PORT=587
   EMAIL_HOST_USER=your-ses-username
   EMAIL_HOST_PASSWORD=your-ses-password
   ```

3. **Mailgun** (Free tier: 100 emails/day)

### Security Best Practices

- Never commit `.env` file to git (it's in `.gitignore`)
- Use environment variables on your hosting platform
- Consider using dedicated email accounts for sending
- Monitor email send rates to avoid spam filters

---

## Troubleshooting

### "Authentication failed"

- Double-check your email and password
- For Gmail, ensure you're using an App Password, not your regular password
- Verify 2FA is enabled

### "Connection refused"

- Check if your firewall is blocking port 587
- Try port 465 with `EMAIL_USE_SSL=True` instead
- Verify the SMTP host is correct

### Emails not received

- Check spam/junk folders
- Verify the recipient email is correct
- Check backend console for errors
- Ensure `is_active=True` for user accounts

### "SMTPAuthenticationError"

- Incorrect password
- Account requires app-specific password
- Account has "Less secure app access" disabled

---

## Email Templates

The system sends three types of emails:

1. **Task Assignment** - When a task is assigned to you
2. **Status Change** - When task status is updated
3. **New Comment** - When someone comments on your task

All emails are HTML formatted with:

- Your branding color (#97aa1a)
- Task details
- Direct link to application
- Professional layout

To customize email templates, edit:
`backend/tasks/emails.py`

---

## Email Flow

```
User Action → Signal Triggered → Email Function → SMTP Server → Recipient
```

### Example: Task Assignment

1. Admin assigns task to User A
2. `post_save` signal triggered
3. `send_task_assignment_email()` called
4. Email sent via SMTP
5. User A receives email

---

## Support

If you need help with email configuration:

1. Check the error messages in the backend console
2. Verify all environment variables are set correctly
3. Test with a simple email client first
4. Review Django's email documentation

---

**Important:** For production deployments, always use environment variables provided by your hosting platform (Heroku, AWS, etc.) instead of `.env` files.
