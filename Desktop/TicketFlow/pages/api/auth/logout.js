export default function handler(req, res) {
  res.setHeader('Set-Cookie', 'tf_session=; Path=/; HttpOnly; Max-Age=0');
  res.json({ success: true });
}
