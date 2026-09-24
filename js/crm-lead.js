/* ===================================================================
   crm-lead.js — one way in for every lead on the site.

   Reads the domain, path and key from js/crm-config.js and posts a
   lead as JSON. Load crm-config.js first, then this file, then the
   page's own form script.

   Usage from any form:

       AdvCRM.send({
           name: 'Asha Roy',
           phone: '9876543210',
           email: 'asha@example.com',       // optional
           city: 'Baruipur',                // optional, falls back to config
           product: 'Orthopaedics',         // the department or service
           lines: {                         // written into the lead's notes
               'Preferred date': '2026-10-02',
               'Symptoms': 'knee pain'
           }
       })

   send()  resolves on success and rejects on failure, so a caller can
           decide what to do.
   post()  never rejects: it resolves true or false, which is what the
           forms use when they also have a fallback of their own.
   =================================================================== */
(function () {
    'use strict';

    function cfg() {
        return window.ADV_CRM_CONFIG || {};
    }

    function endpoint() {
        var c = cfg();
        if (!c.domain || !c.intakePath || !c.key) return '';
        return String(c.domain).replace(/\/+$/, '') +
            c.intakePath +
            c.key;
    }

    function enabled() {
        return cfg().enabled !== false && !!endpoint();
    }

    /* "Appointment request" first, then one "Label: value" per line, with
       empty values dropped so the CRM note stays readable. */
    function notes(title, lines) {
        var out = title ? [title] : [];
        Object.keys(lines || {}).forEach(function (k) {
            var v = lines[k];
            if (v === undefined || v === null) return;
            v = String(v).trim();
            if (v) out.push(k + ': ' + v);
        });
        return out.join('\n');
    }

    function send(lead) {
        var url = endpoint();
        if (!enabled()) {
            return Promise.reject(new Error('CRM is not configured'));
        }

        var body = {
            name: (lead.name || '').toString().trim(),
            phone: (lead.phone || '').toString().trim(),
            email: (lead.email || '').toString().trim(),
            city: (lead.city || cfg().defaultCity || '').toString().trim(),
            product: (lead.product || cfg().defaultProduct || '').toString().trim(),
            message: lead.message || notes(lead.title || 'Website enquiry', lead.lines)
        };

        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json().catch(function () { return {}; });
        });
    }

    /* Same call, but a failure is an answer rather than an error: the form
       that asked can then fall back to email without a console full of
       unhandled rejections. */
    function post(lead) {
        return send(lead).then(function () { return true; }, function () { return false; });
    }

    window.AdvCRM = {
        endpoint: endpoint,
        enabled: enabled,
        notes: notes,
        send: send,
        post: post
    };
})();
