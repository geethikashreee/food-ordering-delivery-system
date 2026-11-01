export function isAdminEmail(email:string,configured=process.env.FOODLY_ADMIN_EMAILS||''):boolean{
  const allowed=configured.split(',').map(value=>value.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}
