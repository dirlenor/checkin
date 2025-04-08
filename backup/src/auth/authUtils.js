const SPECIAL_EMAILS = ['thanawat.siriwisitthana@gmail.com'];

export const checkSpecialAccess = (email) => {
  console.log('Checking special access for:', email);
  console.log('Is in special list:', SPECIAL_EMAILS.includes(email));
  return SPECIAL_EMAILS.includes(email);
}

export const getUserPrivileges = (user) => {
  return {
    canAccessSummary: checkSpecialAccess(user.email),
    // สามารถเพิ่ม privileges อื่นๆ ได้ที่นี่
  }
} 