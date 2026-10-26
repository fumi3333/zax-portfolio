import json
import os
import urllib.request
import urllib.parse
import sys

sys.stdout.reconfigure(encoding='utf-8')

WORK_DIR = r"C:\zax-portfolio\demo\zundamon_explains_v1"
AUDIO_DIR = os.path.join(WORK_DIR, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

META_PATH = os.path.join(WORK_DIR, "scenes_meta.json")
with open(META_PATH, "r", encoding="utf-8") as f:
    scenes = json.load(f)

print(f"=== Generating Audio for {len(scenes)} Scenes via VOICEVOX ===")

for idx, sc in enumerate(scenes):
    scene_id = sc["id"]
    speaker_id = sc["speaker_id"]
    text = sc["text"]
    out_wav = os.path.join(AUDIO_DIR, f"{scene_id}.wav")

    # 1. audio_query
    query_url = f"http://127.0.0.1:50021/audio_query?text={urllib.parse.quote(text)}&speaker={speaker_id}"
    req = urllib.request.Request(query_url, method="POST")
    with urllib.request.urlopen(req) as resp:
        query_data = resp.read()

    # speed adjustment: 1.14x for snappy, engaging tempo
    query_json = json.loads(query_data.decode("utf-8"))
    query_json["speedScale"] = 1.14
    query_json["intonationScale"] = 1.08
    modified_query_data = json.dumps(query_json).encode("utf-8")

    # 2. synthesis
    synth_url = f"http://127.0.0.1:50021/synthesis?speaker={speaker_id}"
    req_synth = urllib.request.Request(
        synth_url,
        data=modified_query_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req_synth) as resp:
        wav_bytes = resp.read()

    with open(out_wav, "wb") as f:
        f.write(wav_bytes)

    print(f"[{idx+1}/{len(scenes)}] Generated audio for {scene_id} ({sc['speaker']}): {len(wav_bytes)/1024:.1f} KB")

print("\nALL AUDIO GENERATED SUCCESSFULLY!")
