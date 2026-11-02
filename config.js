/*
  TEACH Communication: settings you edit once.

  1. Create a free account at https://www.emailjs.com
  2. Add your email service (Gmail or Outlook), then create a template with:
       To email  -> {{to_email}}
       Subject   -> {{subject}}
       Content   -> {{message}}
       Reply-to  -> {{reply_to}}
  3. Paste the 3 codes below. Everyone who opens the site will then send emails automatically,
     without typing the codes on their own computer.

  The EmailJS Public Key is meant to be public (it can only send through YOUR template).
  Never put a private key or password in this file.
*/
window.TEACH_CONFIG = {
  emailjs: {
    serviceId: "",   // example: "service_abc123"
    templateId: "",  // example: "template_xyz789"
    publicKey: ""    // example: "AbCdEfGhIjKlMnOp"
  },
  // Optional: shown in the Manager / CEO email boxes when they are empty
  defaultManager: "",
  defaultCeo: ""
};
