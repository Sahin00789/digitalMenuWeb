// Get device information for login/register
export const getDeviceInfo = () => {
  const deviceId = getOrCreateDeviceId(); // Persistent device ID
  const sessionId = generateSessionId(); // Unique per login session
  const deviceName = getDeviceName();
  
  return {
    deviceId,
    sessionId,
    deviceName,
  };
};

// Get device information for admin authentication (no session ID)
export const getAdminDeviceInfo = () => {
  const deviceId = getOrCreateDeviceId(); // Persistent device ID
  const deviceName = getDeviceName();
  
  return {
    deviceId,
    deviceName,
  };
};

// Get or create persistent device ID
const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

// Generate unique session ID for each login
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get device name from user agent
const getDeviceName = () => {
  const ua = navigator.userAgent;
  let deviceName = 'Web Browser';
  
  if (ua.includes('Chrome')) {
    deviceName = 'Chrome';
  } else if (ua.includes('Firefox')) {
    deviceName = 'Firefox';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    deviceName = 'Safari';
  } else if (ua.includes('Edge')) {
    deviceName = 'Edge';
  }
  
  if (ua.includes('Windows')) {
    deviceName += ' on Windows';
  } else if (ua.includes('Mac')) {
    deviceName += ' on Mac';
  } else if (ua.includes('Linux')) {
    deviceName += ' on Linux';
  }
  
  return deviceName;
};
