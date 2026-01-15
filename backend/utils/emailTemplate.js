const getEmailTemplate = (options) => {
  const { title, content, actionUrl, actionText, footerText } = options;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Notification'}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f6f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
      background-color: #ffffff;
    }
    .content p {
      margin-bottom: 20px;
      font-size: 16px;
      color: #4b5563;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #6366f1;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #4f46e5;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
    }
    /* Utility classes for content injection */
    .highlight {
      font-weight: 600;
      color: #111827;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    .data-table th, .data-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }
    .data-table th {
      background-color: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    .alert {
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .alert-warning {
      background-color: #fffbeb;
      color: #92400e;
      border: 1px solid #fcd34d;
    }
    .alert-critical {
      background-color: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }
    .alert-info {
      background-color: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        border-radius: 0;
      }
      .content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    
    <div class="content">
      ${content}
      
      ${actionUrl && actionText ? `
        <div class="button-container">
          <a href="${actionUrl}" class="button">${actionText}</a>
        </div>
      ` : ''}
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} OrgX. All rights reserved.</p>
      ${footerText ? `<p>${footerText}</p>` : ''}
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = { getEmailTemplate };
