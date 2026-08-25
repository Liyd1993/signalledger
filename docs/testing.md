# Judge smoke test

1. Run `npm install && npm run dev` and open the printed local URL.
2. From the home screen choose **说给我听**.
3. Send ten short, synthetic Chinese messages. Confirm the report button appears only after the tenth text message; uploaded images do not count.
4. Scroll the fixed-height transcript with a mouse wheel and confirm new turns remain at the bottom while older turns remain reachable.
5. Select **生成我的专属报告**, open the archive entry, and confirm the report contains feelings, evidence, a next step, and a next question.
6. Open **生成卡牌**, switch among all three backgrounds, and download a 9:16 PNG. Do not use real personal or medical information in this test.
7. For the AI path, set `TENCENT_API_KEY`, start `agent/server.py`, set `VITE_AGENT_API_URL=http://127.0.0.1:8787`, and repeat steps 3–5. Check `http://127.0.0.1:8787/health` before testing. The Token Plan model is `hy3`; Bedrock is an optional provider, not a requirement for this path.
