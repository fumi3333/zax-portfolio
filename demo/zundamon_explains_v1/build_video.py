import json
import os
import subprocess
import wave
import sys
import shutil

sys.stdout.reconfigure(encoding='utf-8')

WORK_DIR = r"C:\zax-portfolio\demo\zundamon_explains_v1"
SLIDES_DIR = os.path.join(WORK_DIR, "slides")
AUDIO_DIR = os.path.join(WORK_DIR, "audio")
CLIPS_DIR = os.path.join(WORK_DIR, "clips")
os.makedirs(CLIPS_DIR, exist_ok=True)

META_PATH = os.path.join(WORK_DIR, "scenes_meta.json")
with open(META_PATH, "r", encoding="utf-8") as f:
    scenes = json.load(f)

BGM_PATH = r"C:\zax-portfolio\demo\metan_zundamon\piano_bgm.wav"
FINAL_MP4 = os.path.join(WORK_DIR, "koyuchisort_zundamon_explains.mp4")

print(f"=== Building Video Clips for {len(scenes)} Scenes ===")
concat_list = []
total_duration = 0.0

for idx, sc in enumerate(scenes):
    png_file = os.path.join(SLIDES_DIR, f"{sc['id']}.png")
    wav_file = os.path.join(AUDIO_DIR, f"{sc['id']}.wav")
    clip_file = os.path.join(CLIPS_DIR, f"{sc['id']}.mp4")

    with wave.open(wav_file, 'rb') as w:
        dur = w.getnframes() / float(w.getframerate())

    # 0.22s extra pad for snappy natural conversation
    pad_dur = dur + 0.22
    total_duration += pad_dur

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", png_file,
        "-i", wav_file,
        "-c:v", "libx264", "-tune", "stillimage",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-t", str(pad_dur),
        "-shortest",
        clip_file
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    concat_list.append(f"file '{clip_file}'")
    print(f"[{idx+1}/{len(scenes)}] Built clip: {sc['id']}.mp4 ({pad_dur:.2f}s)")

concat_file = os.path.join(WORK_DIR, "concat_clips.txt")
with open(concat_file, "w", encoding="utf-8") as f:
    f.write("\n".join(concat_list))

print(f"\nTotal video duration: {total_duration:.2f}s (~{total_duration/60:.2f} min)")

temp_concat_mp4 = os.path.join(WORK_DIR, "temp_concat.mp4")
print("Concatenating clips...")
cmd_concat = [
    "ffmpeg", "-y",
    "-f", "concat", "-safe", "0",
    "-i", concat_file,
    "-c", "copy",
    temp_concat_mp4
]
subprocess.run(cmd_concat, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# Mix BGM (volume: 0.11, fade out last 3s)
print("Mixing Piano BGM and outputting final MP4 with FastStart...")
fade_out_start = max(0, total_duration - 3.0)
filter_complex = (
    f"[1:a]aloop=loop=-1:size=2e+09,volume=0.11,afade=t=out:st={fade_out_start:.2f}:d=3.0[bgm];"
    f"[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]"
)

cmd_final = [
    "ffmpeg", "-y",
    "-i", temp_concat_mp4,
    "-i", BGM_PATH,
    "-filter_complex", filter_complex,
    "-map", "0:v",
    "-map", "[aout]",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart",
    "-t", str(total_duration),
    FINAL_MP4
]
subprocess.run(cmd_final, check=True)

# Also copy to demo directory
DEMO_DEST = r"C:\zax-portfolio\demo\koyuchisort_zundamon_explains.mp4"
shutil.copy2(FINAL_MP4, DEMO_DEST)

print("\n==========================================")
print("SUCCESS: Generated Zundamon Explains Video:")
print(FINAL_MP4)
print(f"Total Length: {total_duration:.1f} seconds ({total_duration/60:.2f} minutes)")
print(f"File size: {os.path.getsize(FINAL_MP4) / (1024*1024):.2f} MB")
