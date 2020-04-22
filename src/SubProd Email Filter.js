/**
 * SubProd Email Filter v2.2
 * By: Finite Partners https://finite-partners.com/
 * 
 * GitHub Repo: https://github.com/finitepartners/sn-email-filter-subprod
 * SN Share:    https://developer.servicenow.com/connect.do#!/share/contents/1627055_email_filter_for_sub_production_instances
 *
 * This code handles checking all outgoing emails for who they're supposed to
 * send to, and restricts it to only send to a specific group of people.
 *
 * This code is compatible with text notifications, and with calendar invites.
 * This code is overridden by the glide.email.test.user property.
 *
 * Example Usage:
 * On a Dev instance, to have only developers get emails.
 *
 * Specifically:
 * This looks for the property "glide.email.test.group" and if it's populated
 * it looks at all the recepients of the outbound emails, and checks to see
 * if those email addresses or phone numbers belong to the members of the
 * group referenced by sys_id in the property.
 *
 * If the user that created the record the email is about happens to be in the
 * group, they will be added to the recipients list (to simplify testing).
 *
 * Note that in the code below:
 * allowedEmails = people the email is slated to go to
 * grpMembers = email addresses / phone numbers allowed to receive email.
 */

if (current.type != 'received') {
  subprodEmailFilter();
}

function subprodEmailFilter() {
  var table = current.target_table;
  var record = current.instance;
  var recips = current.recipients.split(',');
  var cc = current.copied.split(',');
  var bcc = current.blind_copied.split(',');
  var body = current.body;
  var grpMembers = [];
  var allowedEmails = [];
  var allowedBCCs = [];
  var allowedCCs = [];
  var email = '';
  var phone = '';
  var lastUpdate = '';
  var groupName = '';

  // Grab the sys_id of the email group, and verify it's a valid group.'
  var testGroup = gs.getProperty('glide.email.test.group', '');

  // If the email is not turned on, then this should not run.
  if (testGroup == '') {
    return false;
  }

  // Validate that the group exists.
  var grp = new GlideRecord('sys_user_group');
  if (grp.get('sys_id', testGroup)) {
    groupName = grp.name.toString();
  } else if (grp.get('name', testGroup)) {
    testGroup = grp.sys_id; // Sets the groups sys_id
    groupName = grp.name.toString();
  } else {
    // SubProd Email Group not found, don't send any emails.
    current.type = 'send-ignored';
    gs.error('Email Test Group "' + groupName + '" provided but does not match a valid group, so no email has been sent. Check property glide.email.test.group.');
    return false;
  }

  // Look through all members of the test group, checking their email and phone.
  var grpMember = new GlideRecord('sys_user_grmember');
  grpMember.addQuery('group', testGroup);
  grpMember.query();
  var ndv;
  while (grpMember.next()) {
    // For each user, check their email
    email = grpMember.user.email.toString();
    if (recips.indexOf(email) >= 0) {
      allowedEmails.push(grpMember.user.email.toString()); // Create an array of emails from the original recipients that are allowed to receive emails
    }
    if (bcc.indexOf(email) >= 0) {
      allowedBCCs.push(grpMember.user.email.toString()); // Create an array of emails from the original recipients that are allowed to receive emails
    }
    if (cc.indexOf(email) >= 0) {
      allowedCCs.push(grpMember.user.email.toString()); // Create an array of emails from the original recipients that are allowed to receive emails
    }
    grpMembers.push(grpMember.user.email.toString()); // Create an array of all test group members

    // Lookup that member's notification devices, and add those to the allowed list.
    ndv = new GlideRecord('cmn_notif_device');
    ndv.addQuery('active', true);
    ndv.addQuery('user', grpMember.user);
    ndv.addQuery('email_address', '!=', email);
    ndv.query();
    while (ndv.next()) {
      if (ndv.type == 'SMS') {
        phone = String(ndv.phone_number) + '@' + String(ndv.service_provider.email_suffix);
      } else {
        phone = String(ndv.email_address);
      }

      if (recips.indexOf(phone) >= 0) {
        allowedEmails.push(phone); // Add the phone number to the allowed emails list.
      }
      if (bcc.indexOf(phone) >= 0) {
        allowedBCCs.push(phone); // Create an array of emails from the original recipients that are allowed to receive emails
      }
      if (cc.indexOf(phone) >= 0) {
        allowedCCs.push(phone); // Create an array of emails from the original recipients that are allowed to receive emails
      }
      grpMembers.push(phone); // Add the phone number to the group members list.
    }
  }

  // Look to see who last updated the referenced record.
  if (table) {
    var tableGR = new GlideRecord(table);
    if (tableGR.get(record)) {
      lastUpdate = tableGR.sys_updated_by;
    }
  }

  // Check to see if the last updated user is in the current allowedEmails array and add them if they are not and valid.
  // Only do this if there are no valid recipients.
  if (lastUpdate && !allowedEmails) {
    var usr = new GlideRecord('sys_user');
    usr.addQuery('user_name', lastUpdate);
    usr.addQuery('notification', 2); // Check to see if the user has notification set to "Email" which is 2.
    usr.query();
    if (usr.next()) {
      if (grpMembers.toString().indexOf(usr.email) >= 0) {
        // Are they a valid user.
        if (allowedEmails.toString().indexOf(usr.email) == -1) {
          // Are they already in the allowedEmails array.
          allowedEmails.push(usr.email.toString());
        }
      }
    }
  }

  // If the current recipients field is blank then set the text to NONE.
  if (recips == '') {
    recips = 'NONE';
  }

  // DO NOT APPEND anything if this is a calendar invite. It will mess it up if you do.
  if (body.indexOf('END:VCALENDAR') < 0) {
    current.body = body + '<div><br/><br/><hr/></div><div>Testing mode on via system property "glide.email.test.group". Intended recipients: ' + recips + '</div><br/>';
  }

  // If there are no alowed recipients then set the email to send-ignored and clear the recipients field.
  if (allowedEmails.length == 0) {
    current.type = 'send-ignored';
    current.recipients = '';
  } else {
    current.recipients = allowedEmails.toString();
    current.blind_copied = allowedBCCs.toString();
    current.copied = allowedCCs.toString();
  }
  return true;
}
