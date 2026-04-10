// Pure time utility functions — take config as a parameter so they remain testable

export function isFriday(date = new Date()) {
  return date.getDay() === 5;
}

export function getPartyTime(date, config) {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const override = (config.overrides || []).find((o) => o.date === dateStr);
  if (override) {
    return { hour: override.hour, minute: override.minute };
  }
  return { ...config.defaultPartyTime };
}

export function checkIsPartyTime(config, testMode = false) {
  if (testMode) return true;

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();

  const { hour: partyHour, minute: partyMinute } = getPartyTime(now, config);
  const pastPartyTime = hour > partyHour || (hour === partyHour && minute >= partyMinute);

  // Friday after party time, or Saturday before midnight (hour < 0 never true, kept for parity)
  return (day === 5 && pastPartyTime) || (day === 6 && hour < 0);
}

export function computeNextPartyTime(config, testMode = false) {
  const now = new Date();
  if (checkIsPartyTime(config, testMode)) return new Date(now);

  const day = now.getDay();
  let daysUntilFriday = (5 - day + 7) % 7;
  if (day === 6) daysUntilFriday = 6; // Saturday → next Friday in 6 days

  const target = new Date(now);
  target.setDate(target.getDate() + daysUntilFriday);
  const { hour, minute } = getPartyTime(target, config);
  target.setHours(hour, minute, 0, 0);
  return target;
}

export function computeTimeState(config, testMode = false) {
  const party = checkIsPartyTime(config, testMode);
  const nextPartyTime = computeNextPartyTime(config, testMode);

  let remainingTime;
  if (party) {
    remainingTime = 'HET IS TIJD VOOR HET KARRETJE!';
  } else {
    const ms = nextPartyTime - new Date();
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    remainingTime = `Nog: ${days}d ${hours}h ${minutes}m voordat het tijd is voor het karretje`;
  }

  const nextTimeStr = `${String(nextPartyTime.getHours()).padStart(2, '0')}:${String(
    nextPartyTime.getMinutes()
  ).padStart(2, '0')}`;

  return {
    isPartyTime: party,
    message: party ? 'JA' : 'NEE',
    remainingTime,
    nextPartyTimeStr: nextTimeStr,
  };
}

