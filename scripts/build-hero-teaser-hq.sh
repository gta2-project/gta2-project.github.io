#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MATERIALS="${GTA2_MATERIALS_DIR:-$ROOT/../GTA-2-Website_Material}"
VIDEO_ROOT="${GTA2_VIDEO_ROOT:-${HOME}/Downloads/gta-2-videos}"
MEDIA="$ROOT/public/media"
WORK="$ROOT/tmp/hero-teaser-hq"
NATIVE_WORK="$WORK/native-task-clips"

mkdir -p "$MEDIA" "$NATIVE_WORK"

TASKS=(wiping pouring cutting unscrew microwave ipad sweeping obstacle fruits typo ball cube iron drawer)
SOURCES=(
	"wiping/wiping_1.mov"
	"pouring/pouring_1.mov"
	"cutting/cutting_1.mov"
	"unscrew/unscrew_1.MOV"
	"microwave/microwave_1.mov"
	"ipad/ipad_1.mp4"
	"sweeping/sweeping_1.mov"
	"obstacle/obstacle_1.mov"
	"fruits/fruits_1.mov"
	"typo/typo_1.mov"
	"ball/ball_1.mp4"
	"cube/cube_1.mov"
	"iron/iron_1.mov"
	"drawer/drawer_1.mp4"
)

# Source ranges mirror the reviewed social teaser, while every output task clip
# remains three seconds long. Only the website-specific framing is omitted.
STARTS=(14.00 27.00 7.00 15.33 11.33 24.00 11.00 14.25 48.33 21.67 13.00 13.67 27.00 5.00)
ENDS=(27.49 33.00 15.22 30.41 23.12 34.40 22.11 23.77 93.44 41.33 20.05 22.17 44.46 17.50)

echo "Building website task clips from the original recordings…"
for index in "${!TASKS[@]}"; do
	printf -v number "%02d" "$index"
	source_path="$VIDEO_ROOT/${SOURCES[$index]}"
	clip_duration="$(awk -v start="${STARTS[$index]}" -v end="${ENDS[$index]}" 'BEGIN { printf "%.2f", end - start }')"
	transfer="$(ffprobe -v error -select_streams v:0 -show_entries stream=color_transfer -of default=nw=1:nk=1 "$source_path")"
	input_args=( -ss 0 -t "$clip_duration" )
	clip_input="$source_path"

	if [[ "$transfer" == "arib-std-b67" ]]; then
		clip_input="$NATIVE_WORK/${TASKS[$index]}-bt709.mov"
		xcrun avconvert -s "$source_path" -p Preset1920x1080 -o "$clip_input" \
			--start "${STARTS[$index]}" --duration "$clip_duration" --replace --disableMetadataFilter >/dev/null
	else
		input_args=( -ss "${STARTS[$index]}" -t "$clip_duration" )
	fi

	ffmpeg -hide_banner -loglevel error -y \
		"${input_args[@]}" -i "$clip_input" \
		-vf "crop=iw*850/956:ih*478/538:iw*53/956:ih*60/538,scale=1920:1080:flags=lanczos:in_range=tv:out_range=tv,fps=30,format=yuv420p,setsar=1,setpts=3.0/${clip_duration}*(PTS-STARTPTS),settb=AVTB,setpts=PTS-STARTPTS,setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709" \
		-t 3 -c:v libx264 -preset slow -crf 11 -pix_fmt yuv420p -an -map_metadata -1 \
		-colorspace bt709 -color_trc bt709 -color_primaries bt709 \
		"$WORK/task-${number}.mp4"
done

echo "Assembling the website hero cut…"
ffmpeg -hide_banner -loglevel error -y \
	-i "$WORK/task-00.mp4" -i "$WORK/task-01.mp4" -i "$WORK/task-02.mp4" -i "$WORK/task-03.mp4" \
	-i "$WORK/task-04.mp4" -i "$WORK/task-05.mp4" -i "$WORK/task-06.mp4" -i "$WORK/task-07.mp4" \
	-i "$WORK/task-08.mp4" -i "$WORK/task-09.mp4" -i "$WORK/task-10.mp4" -i "$WORK/task-11.mp4" \
	-i "$WORK/task-12.mp4" -i "$WORK/task-13.mp4" \
	-ss 9.5 -t 4.0 -i "$MATERIALS/GUI_Demo_Video.mp4" \
	-ss 27.0 -t 4.2 -i "$MATERIALS/GUI_Demo_Video.mp4" \
	-ss 38.5 -t 4.2 -i "$MATERIALS/GUI_Demo_Video.mp4" \
	-ss 77.5 -t 4.8 -i "$MATERIALS/GUI_Demo_Video.mp4" \
	-ss 96.5 -t 4.5 -i "$MATERIALS/GUI_Demo_Video.mp4" \
	-ss 168.0 -t 14.8 -i "$MATERIALS/GUI_Demo_Video.mp4" \
	-filter_complex "[0:v]fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.35[v0];[1:v]fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v1];[2:v]fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v2];[3:v]fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v3];[4:v]fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v4];[5:v]fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v5];[6:v]fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v6];[7:v]fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v7];[8:v]fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v8];[9:v]fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v9];[10:v]fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v10];[11:v]fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v11];[12:v]fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v12];[13:v]fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v13];[14:v]scale=1920:1080:flags=lanczos:in_range=tv:out_range=tv,fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS,setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709[v14];[15:v]scale=1920:1080:flags=lanczos:in_range=tv:out_range=tv,fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS,setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709[v15];[16:v]scale=1920:1080:flags=lanczos:in_range=tv:out_range=tv,fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS,setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709[v16];[17:v]scale=1920:1080:flags=lanczos:in_range=tv:out_range=tv,fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS,setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709[v17];[18:v]scale=1920:1080:flags=lanczos:in_range=tv:out_range=tv,fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS,setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709[v18];[19:v]scale=1920:1080:flags=lanczos:in_range=tv:out_range=tv,fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS,fade=t=out:st=14.45:d=0.35,setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709[v19];[v0][v1]xfade=transition=fade:duration=0.24:offset=2.76[x1];[x1][v2]xfade=transition=fade:duration=0.24:offset=5.52[x2];[x2][v3]xfade=transition=fade:duration=0.24:offset=8.28[x3];[x3][v4]xfade=transition=fade:duration=0.24:offset=11.04[x4];[x4][v5]xfade=transition=fade:duration=0.24:offset=13.80[x5];[x5][v6]xfade=transition=fade:duration=0.24:offset=16.56[x6];[x6][v7]xfade=transition=fade:duration=0.24:offset=19.32[x7];[x7][v8]xfade=transition=fade:duration=0.24:offset=22.08[x8];[x8][v9]xfade=transition=fade:duration=0.24:offset=24.84[x9];[x9][v10]xfade=transition=fade:duration=0.24:offset=27.60[x10];[x10][v11]xfade=transition=fade:duration=0.24:offset=30.36[x11];[x11][v12]xfade=transition=fade:duration=0.24:offset=33.12[x12];[x12][v13]xfade=transition=fade:duration=0.24:offset=35.88[x13];[x13][v14]xfade=transition=fade:duration=0.24:offset=38.64[x14];[x14][v15]xfade=transition=fade:duration=0.24:offset=42.40[x15];[x15][v16]xfade=transition=fade:duration=0.24:offset=46.36[x16];[x16][v17]xfade=transition=fade:duration=0.24:offset=50.32[x17];[x17][v18]xfade=transition=fade:duration=0.24:offset=54.88[x18];[x18][v19]xfade=transition=fade:duration=0.24:offset=59.14,setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709[outv]" \
	-map "[outv]" -t 73.94 -c:v libx264 -tag:v avc1 -profile:v high -level 4.2 \
	-preset slow -crf 20 -maxrate 4M -bufsize 8M -g 60 -keyint_min 60 -sc_threshold 0 \
	-pix_fmt yuv420p -movflags +faststart -map_metadata -1 -an \
	-colorspace bt709 -color_trc bt709 -color_primaries bt709 \
	"$WORK/gta2-hero-cut.mp4"

if [[ -f "$MEDIA/gta2-hero-cut.mp4" && ! -f "$WORK/original-gta2-hero-cut.mp4" ]]; then
	cp -p "$MEDIA/gta2-hero-cut.mp4" "$WORK/original-gta2-hero-cut.mp4"
fi

mv "$WORK/gta2-hero-cut.mp4" "$MEDIA/gta2-hero-cut.mp4"

ffmpeg -hide_banner -loglevel error -y -ss 2.5 -i "$MEDIA/gta2-hero-cut.mp4" \
	-frames:v 1 -vf "scale=1920:1080:flags=lanczos" -q:v 2 -map_metadata -1 \
	"$MEDIA/gta2-hero-poster.jpg"

echo "Website hero teaser complete."
