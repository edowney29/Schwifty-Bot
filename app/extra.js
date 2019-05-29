/* Unused
const getZone = zone => {
  switch (zone) {
    case "EDT":
    case "EST":
    case "EASTERN":
      return "America/New_York";
    case "CDT":
    case "CST":
    case "CENTRAL":
      return "America/Chicago";
    case "MDT":
    case "MST":
    case "MOUNTAIN":
      return "America/Denver";
    case "PST":
    case "PDT":
    case "PACIFIC":
      return "America/Los_Angeles";
    case "GMT":
    case "IST":
    case "IRELAND":
      return "Europe/Dublin";
    default:
      return null;
  }
};

if (_.includes(string, "tz ")) {
  var msg = _.toUpper(string);
  msg = _.split(msg, " ");

  var index = msg.indexOf("TZ");

  var time = msg[index + 1].split(":");
  var hours = parseInt(time[0]);
  var minutes = parseInt(time[1]);

  var tz = msg[index + 2];
  var zone = getZone(tz);

  if (zone == null) {
    message.reply("Unknown Timezone");
    return;
  }

  // Create date object with user inputted time in timezone
  var now = moment_tz.tz(moment().utc(), zone);
  var date = moment(now);
  date.set("hours", hours + 12);
  date.set("minutes", minutes);

  // Tz mutates date, does not return new one
  message.reply(
    "\n" +
      date.tz("America/New_York").zoneAbbr() +
      ":\t" +
      date.format("h:mm a") +
      "\n" +
      date.tz("America/Chicago").zoneAbbr() +
      ":\t" +
      date.format("h:mm a") +
      "\n" +
      date.tz("America/Denver").zoneAbbr() +
      ":\t" +
      date.format("h:mm a") +
      "\n" +
      date.tz("America/Los_Angeles").zoneAbbr() +
      ":\t" +
      date.format("h:mm a") +
      "\n" +
      date.tz("Europe/Dublin").zoneAbbr() +
      ":\t" +
      date.format("h:mm a")
  );
}
*/
