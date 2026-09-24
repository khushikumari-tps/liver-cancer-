/* ===================================================================
   crm-config.js — the only file to edit when the CRM moves or its key
   is rotated.

   Every form on the site sends its lead through js/crm-lead.js, which
   reads the domain, the path and the key from here. Nothing else in the
   codebase holds the key, so one change here covers the hospital
   appointment form, the contact page and the landing pages, and any
   form added later.

   The full endpoint is built as: domain + intakePath + key

   Set `enabled` to false to stop posting to the CRM without removing
   any markup: each form then falls back to the behaviour it had before
   (Netlify Forms or the visitor's mail app), so no enquiry is lost.
   =================================================================== */
window.ADV_CRM_CONFIG = {

    /* ---- where the leads go ---- */
    domain: 'https://app.speedoone.com',
    intakePath: '/api/crm-public/intake/website/',
    key: 'bc79cbb441bbbec4d660d5978d86b9ab38da',

    /* ---- defaults applied to every lead when a form does not set them ---- */
    defaultCity: 'Baruipur',
    defaultProduct: 'General enquiry',

    /* ---- master switch ---- */
    enabled: true
};
