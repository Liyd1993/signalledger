# Judge smoke test

1. Run `npm install && npm run dev` and open the printed local URL.
2. From the home screen choose **说给我听**.
3. Send ten short, synthetic Chinese messages. Confirm the report button appears only after the tenth text message; uploaded images do not count.
4. Scroll the fixed-height transcript with a mouse wheel and confirm new turns remain at the bottom while older turns remain reachable.
5. Select **生成我的专属报告**, open the archive entry, and confirm the report contains feelings, evidence, a next step, and a next question.
6. Open **生成卡牌**, switch among all three backgrounds, and download a 9:16 PNG. Do not use real personal or medical information in this test.
7. For the free AI path, install Ollama, run `ollama pull gemma4:12b`, start `ollama serve`, then start `agent/server.py` with `MODEL_PROVIDER=ollama`. Set `VITE_AGENT_API_URL=http://127.0.0.1:8787` and repeat steps 3–5. Check `http://127.0.0.1:8787/health` before testing. Tencent Token Plan and Bedrock are optional providers.
