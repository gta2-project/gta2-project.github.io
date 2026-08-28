#!/usr/bin/env bash
set -euo pipefail

MATERIALS_DIR="${GTA2_MATERIALS_DIR:-../GTA-2-Website_Material}"
PUBLIC_MEDIA="public/media"
SOURCE_IMAGES="src/assets"
SCRATCH_DIR="tmp/media"

mkdir -p "$PUBLIC_MEDIA" "$SOURCE_IMAGES" "$SCRATCH_DIR"

encode_video() {
	local input="$1"
	local output="$2"
	local height="$3"
	local crf="$4"

	ffmpeg -hide_banner -loglevel error -y -i "$input" \
		-vf "scale=-2:${height}:flags=lanczos,fps=30" \
		-c:v libx264 -profile:v high -level 4.1 -preset medium -crf "$crf" \
		-pix_fmt yuv420p -movflags +faststart -map_metadata -1 -an "$output"
}

make_poster() {
	local input="$1"
	local output="$2"
	local seek="${3:-5}"

	ffmpeg -hide_banner -loglevel error -y -ss "$seek" -i "$input" \
		-frames:v 1 -vf "scale=960:-2:flags=lanczos" -q:v 3 -map_metadata -1 "$output"
}

sanitize_png() {
	local input="$1"
	local output="$2"
	ffmpeg -hide_banner -loglevel error -y -i "$input" -frames:v 1 -map_metadata -1 "$output"
}

sanitize_png "$MATERIALS_DIR/gta2.png" "$SOURCE_IMAGES/method-architecture.png"
sanitize_png "$MATERIALS_DIR/gta_tasks.png" "$SOURCE_IMAGES/task-panorama.png"
sanitize_png "$MATERIALS_DIR/One-Success_and_Zero-Shot_GTA-2_Performance.png" "$SOURCE_IMAGES/results-original.png"
sanitize_png "$MATERIALS_DIR/Zero-Shot_Performance_and_Feedback_Progression.png" "$SOURCE_IMAGES/feedback-original.png"

for stem in wiping pouring cutting unscrew microwave sweeping obstacle fruits typo; do
	encode_video "$MATERIALS_DIR/grid_videos_all/${stem}_grid.mp4" "$PUBLIC_MEDIA/task-${stem}.mp4" 720 23
	make_poster "$PUBLIC_MEDIA/task-${stem}.mp4" "$PUBLIC_MEDIA/task-${stem}-poster.jpg" 6
done

encode_video "$MATERIALS_DIR/GTA-2-Controllers.mp4" "$PUBLIC_MEDIA/controllers.mp4" 1080 23
make_poster "$PUBLIC_MEDIA/controllers.mp4" "$PUBLIC_MEDIA/controllers-poster.jpg" 14

encode_video "$MATERIALS_DIR/GUI_Demo_Video.mp4" "$PUBLIC_MEDIA/gui-full-demo.mp4" 1080 24
make_poster "$PUBLIC_MEDIA/gui-full-demo.mp4" "$PUBLIC_MEDIA/gui-full-demo-poster.jpg" 79

encode_video "$MATERIALS_DIR/Pi-05-Benchmark-Video.mp4" "$PUBLIC_MEDIA/pi05-benchmark.mp4" 720 25
make_poster "$PUBLIC_MEDIA/pi05-benchmark.mp4" "$PUBLIC_MEDIA/pi05-benchmark-poster.jpg" 62

declare -a BONUS_SOURCES=(
	"put_the_marker_into_the_cup.MP4"
	"draw_a_sqaure_around_the_ball.mov"
	"fix_the_typo(but funny because it fixes another word it sees at the top instead of the target word at the bottom).MP4"
	"put_the_pingpong_ball_into_the_bowl.mov"
	"put_the_ball_where_it_belongs_to.MP4"
)
declare -a BONUS_NAMES=("marker-cup" "draw-square" "unexpected-typo" "pingpong-bowl" "ball-zone")

for index in "${!BONUS_SOURCES[@]}"; do
	name="${BONUS_NAMES[$index]}"
	encode_video "$MATERIALS_DIR/bonus_videos_can_be_put_at_THE_END/${BONUS_SOURCES[$index]}" "$PUBLIC_MEDIA/more-${name}.mp4" 720 23
	make_poster "$PUBLIC_MEDIA/more-${name}.mp4" "$PUBLIC_MEDIA/more-${name}-poster.jpg" 5
done

unzip -jo "$MATERIALS_DIR/GTA2_Internship_Research_Talk.key" 'Data/ipad_grid-1693.mp4' -d "$SCRATCH_DIR" >/dev/null
encode_video "$SCRATCH_DIR/ipad_grid-1693.mp4" "$PUBLIC_MEDIA/more-phone-call.mp4" 720 23
make_poster "$PUBLIC_MEDIA/more-phone-call.mp4" "$PUBLIC_MEDIA/more-phone-call-poster.jpg" 6

# Hero edit: accelerated task breadth → instruction → composition → execution → feedback → revised execution.
# The task clips use a single execution quadrant from the source grids so the
# robot motion remains legible inside the smaller hero frame.
ffmpeg -hide_banner -loglevel error -y \
	-ss 6.0 -t 6.0 -i "$MATERIALS_DIR/grid_videos_all/wiping_grid.mp4" \
	-ss 6.0 -t 6.0 -i "$MATERIALS_DIR/grid_videos_all/pouring_grid.mp4" \
	-ss 6.0 -t 6.0 -i "$MATERIALS_DIR/grid_videos_all/cutting_grid.mp4" \
	-ss 6.0 -t 6.0 -i "$MATERIALS_DIR/grid_videos_all/unscrew_grid.mp4" \
	-ss 5.5 -t 6.0 -i "$MATERIALS_DIR/grid_videos_all/microwave_grid.mp4" \
	-ss 6.0 -t 6.0 -i "$MATERIALS_DIR/grid_videos_all/sweeping_grid.mp4" \
	-ss 6.0 -t 6.0 -i "$MATERIALS_DIR/grid_videos_all/obstacle_grid.mp4" \
	-ss 6.0 -t 6.0 -i "$MATERIALS_DIR/grid_videos_all/fruits_grid.mp4" \
	-ss 6.0 -t 6.0 -i "$MATERIALS_DIR/grid_videos_all/typo_grid.mp4" \
	-ss 9.5 -t 4.0 -i "$MATERIALS_DIR/GUI_Demo_Video.mp4" \
	-ss 27.0 -t 4.2 -i "$MATERIALS_DIR/GUI_Demo_Video.mp4" \
	-ss 38.5 -t 4.2 -i "$MATERIALS_DIR/GUI_Demo_Video.mp4" \
	-ss 77.5 -t 4.8 -i "$MATERIALS_DIR/GUI_Demo_Video.mp4" \
	-ss 96.5 -t 4.5 -i "$MATERIALS_DIR/GUI_Demo_Video.mp4" \
	-ss 168.0 -t 5.5 -i "$MATERIALS_DIR/GUI_Demo_Video.mp4" \
	-filter_complex "[0:v]crop=850:478:53:60,scale=1280:720:flags=lanczos,format=yuv420p,eq=gamma=0.88:contrast=1.04:saturation=0.92,setsar=1,setpts=0.5*(PTS-STARTPTS),fps=30,settb=AVTB,setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.35[v0];[1:v]crop=850:478:53:60,scale=1280:720:flags=lanczos,format=yuv420p,eq=gamma=0.88:contrast=1.04:saturation=0.92,setsar=1,setpts=0.5*(PTS-STARTPTS),fps=30,settb=AVTB,setpts=PTS-STARTPTS[v1];[2:v]crop=850:478:53:60,scale=1280:720:flags=lanczos,format=yuv420p,eq=gamma=0.88:contrast=1.04:saturation=0.92,setsar=1,setpts=0.5*(PTS-STARTPTS),fps=30,settb=AVTB,setpts=PTS-STARTPTS[v2];[3:v]crop=850:478:53:60,scale=1280:720:flags=lanczos,format=yuv420p,eq=gamma=0.88:contrast=1.04:saturation=0.92,setsar=1,setpts=0.5*(PTS-STARTPTS),fps=30,settb=AVTB,setpts=PTS-STARTPTS[v3];[4:v]crop=850:478:53:60,scale=1280:720:flags=lanczos,format=yuv420p,eq=gamma=0.88:contrast=1.04:saturation=0.92,setsar=1,setpts=0.5*(PTS-STARTPTS),fps=30,settb=AVTB,setpts=PTS-STARTPTS[v4];[5:v]crop=850:478:53:60,scale=1280:720:flags=lanczos,format=yuv420p,eq=gamma=0.88:contrast=1.04:saturation=0.92,setsar=1,setpts=0.5*(PTS-STARTPTS),fps=30,settb=AVTB,setpts=PTS-STARTPTS[v5];[6:v]crop=850:478:53:60,scale=1280:720:flags=lanczos,format=yuv420p,eq=gamma=0.88:contrast=1.04:saturation=0.92,setsar=1,setpts=0.5*(PTS-STARTPTS),fps=30,settb=AVTB,setpts=PTS-STARTPTS[v6];[7:v]crop=850:478:53:60,scale=1280:720:flags=lanczos,format=yuv420p,eq=gamma=0.88:contrast=1.04:saturation=0.92,setsar=1,setpts=0.5*(PTS-STARTPTS),fps=30,settb=AVTB,setpts=PTS-STARTPTS[v7];[8:v]crop=850:478:53:60,scale=1280:720:flags=lanczos,format=yuv420p,eq=gamma=0.88:contrast=1.04:saturation=0.92,setsar=1,setpts=0.5*(PTS-STARTPTS),fps=30,settb=AVTB,setpts=PTS-STARTPTS[v8];[9:v]scale=1280:720:flags=lanczos,fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v9];[10:v]scale=1280:720:flags=lanczos,fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v10];[11:v]scale=1280:720:flags=lanczos,fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v11];[12:v]scale=1280:720:flags=lanczos,fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v12];[13:v]scale=1280:720:flags=lanczos,fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS[v13];[14:v]scale=1280:720:flags=lanczos,fps=30,format=yuv420p,setsar=1,settb=AVTB,setpts=PTS-STARTPTS,fade=t=out:st=5.15:d=0.35[v14];[v0][v1]xfade=transition=fade:duration=0.24:offset=2.76[x1];[x1][v2]xfade=transition=fade:duration=0.24:offset=5.52[x2];[x2][v3]xfade=transition=fade:duration=0.24:offset=8.28[x3];[x3][v4]xfade=transition=fade:duration=0.24:offset=11.04[x4];[x4][v5]xfade=transition=fade:duration=0.24:offset=13.80[x5];[x5][v6]xfade=transition=fade:duration=0.24:offset=16.56[x6];[x6][v7]xfade=transition=fade:duration=0.24:offset=19.32[x7];[x7][v8]xfade=transition=fade:duration=0.24:offset=22.08[x8];[x8][v9]xfade=transition=fade:duration=0.24:offset=24.84[x9];[x9][v10]xfade=transition=fade:duration=0.24:offset=28.60[x10];[x10][v11]xfade=transition=fade:duration=0.24:offset=32.56[x11];[x11][v12]xfade=transition=fade:duration=0.24:offset=36.52[x12];[x12][v13]xfade=transition=fade:duration=0.24:offset=41.08[x13];[x13][v14]xfade=transition=fade:duration=0.24:offset=45.34[mixed];[mixed]setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709[outv]" \
	-map "[outv]" -c:v libx264 -profile:v high -level 4.1 -preset medium -crf 23 \
	-pix_fmt yuv420p -movflags +faststart -map_metadata -1 -an \
	-colorspace bt709 -color_trc bt709 -color_primaries bt709 "$PUBLIC_MEDIA/gta2-hero-cut.mp4"
make_poster "$PUBLIC_MEDIA/gta2-hero-cut.mp4" "$PUBLIC_MEDIA/gta2-hero-poster.jpg" 1.5

find "$PUBLIC_MEDIA" -type f -maxdepth 1 -print0 | xargs -0 xattr -c 2>/dev/null || true
find "$SOURCE_IMAGES" -type f -maxdepth 1 -print0 | xargs -0 xattr -c 2>/dev/null || true
