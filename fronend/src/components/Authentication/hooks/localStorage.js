// Set an item in localStorage with an expiration time (in minutes)
export const setLocalStorage = (key, value, expirationMinutes) => {
    const expirationTimestamp = new Date().getTime() + expirationMinutes * 60 * 1000;
    const item = {
        value: value,
        expiration: expirationTimestamp
    }
    localStorage.setItem(key, JSON.stringify(item));
  };


// Get an item from localStorage, checking if it has expired
export const getLocalStorage = (key) => {
    const item = localStorage.getItem(key);
    if (item) {
      const { value, expiration } = JSON.parse(item);
      const currentTime = new Date().getTime();
      if (currentTime < expiration) {
        return value;
      }
      localStorage.removeItem(key);
    }
    return null;
  };