export type AgentKey = 'task' | 'skill' | 'parameter' | 'vision';

export interface TaskDemo {
	id: string;
	title: string;
	category: string;
	video: string;
	poster: string;
}

export interface BenchmarkTask {
	title: string;
	shortTitle: string;
	values: {
		oneSuccess: number;
		zeroShot: number;
		pi05: number;
		capTac: number;
		capPrimitive: number;
	};
}

export interface FeedbackRound {
	label: string;
	success: number;
	feedback: Record<AgentKey, number>;
}

export interface FeedbackProgression {
	title: string;
	rounds: FeedbackRound[];
}

export interface MethodOutputGroup {
	label: string;
	items: string[];
	ordered?: boolean;
	code?: boolean;
}

export interface MethodStep {
	id: string;
	index: string;
	title: string;
	agent: string;
	description: string;
	input: string;
	output: string;
	outputGroups?: MethodOutputGroup[];
	color: AgentKey | 'neutral' | 'execution';
}

export interface MoreBehavior extends TaskDemo {
	description: string;
	feature?: 'ambiguity';
}

const feedback = (task = 0, skill = 0, parameter = 0, vision = 0): Record<AgentKey, number> => ({ task, skill, parameter, vision });

export const taskDemos: TaskDemo[] = [
	{ id: 'wiping', title: 'Erase the Red Scribble', category: 'Contact-rich surface interaction and coverage', video: '/media/task-wiping.mp4', poster: '/media/task-wiping-poster.jpg' },
	{ id: 'pouring', title: 'Grasp the Cup by the Handle and Gently Pour into the Box', category: 'Pouring, dispensing, and material transfer', video: '/media/task-pouring.mp4', poster: '/media/task-pouring-poster.jpg' },
	{ id: 'cutting', title: 'Cut the Dough/Sponge with the Knife in Hand', category: 'Deformable object manipulation', video: '/media/task-cutting.mp4', poster: '/media/task-cutting-poster.jpg' },
	{ id: 'unscrew', title: 'Unscrew the Black Nut', category: 'Precision alignment, insertion, fastening, and hanging', video: '/media/task-unscrew.mp4', poster: '/media/task-unscrew-poster.jpg' },
	{ id: 'microwave', title: 'Start the Microwave', category: 'Device operation', video: '/media/task-microwave.mp4', poster: '/media/task-microwave-poster.jpg' },
	{ id: 'phone-call', title: 'Pick Up the Phone Call', category: 'Device operation', video: '/media/more-phone-call.mp4', poster: '/media/more-phone-call-poster.jpg' },
	{ id: 'sweeping', title: 'Sweep the Trash into the Dustpan', category: 'Clutter cleanup and multi-object organization', video: '/media/task-sweeping.mp4', poster: '/media/task-sweeping-poster.jpg' },
	{ id: 'obstacle', title: 'Put the Ball into the Basket (There Is a Wall Obstacle in Between)', category: 'Basic pick and place for VLA', video: '/media/task-obstacle.mp4', poster: '/media/task-obstacle-poster.jpg' },
	{ id: 'fruits', title: 'Put the Fruits into the White Bowl / Put the Others into the Pink Container', category: 'Clutter cleanup and multi-object organization', video: '/media/task-fruits.mp4', poster: '/media/task-fruits-poster.jpg' },
	{ id: 'typo', title: 'Fix the Typo', category: 'Semantic reasoning and ordering', video: '/media/task-typo.mp4', poster: '/media/task-typo-poster.jpg' },
];

export const methodSteps: MethodStep[] = [
	{
		id: 'instruction', index: '00', title: 'Begin with a task instruction and an RGB-D scene.', agent: 'Task prompt + RGB-D scene',
		description: 'The instruction specifies the desired outcome while the observation and reusable controller library provide the scene and action vocabulary used by the four agents.',
		input: '“put the bottle into the box”', output: 'Inputs for the four-agent pipeline', color: 'neutral',
		outputGroups: [{ label: 'Inputs', items: ['Task prompt: put the bottle into the box', 'RGB-D scene observation', 'Reusable task-axis controller library'] }],
	},
	{
		id: 'decomposer', index: '01', title: 'Convert the instruction into ordered subtasks.', agent: 'Task Decomposer',
		description: 'The Task Decomposer exposes the temporal and semantic structure of the manipulation behavior before any controller is selected.',
		input: 'Task prompt + scene context', output: 'Ordered Subtasks', color: 'task',
		outputGroups: [{ label: 'Ordered Subtasks', ordered: true, items: ['Approach bottle for pre-grasp', 'Grasp the bottle', 'Lift the bottle up', 'Move over the box', 'Place down the bottle', 'Release and retract'] }],
	},
	{
		id: 'generator', index: '02', title: 'Map each subtask to an abstract skill recipe.', agent: 'Skill Generator',
		description: 'For each subtask, the Skill Generator selects symbolic object features, task axes, controller compositions, and priorities from the reusable controller library.',
		input: 'Ordered subtasks + controller library', output: 'Abstract Skill Recipes', color: 'skill',
		outputGroups: [
			{ label: 'Highlighted subtask', items: ['04 · Move over the box'] },
			{ label: 'Keypoints', code: true, items: ['bottle_cap', 'box_inside'] },
			{ label: 'Controllers', code: true, ordered: true, items: ['PosAlign(bottle_cap, box_inside, o_z)', 'PosAlign(bottle_cap, box_inside, o_y)', 'PosAlign(bottle_cap, box_inside, o_x)', 'AxisAlign(eef_z, box_inside_norm, o_θ)'] },
		],
	},
	{
		id: 'parameters', index: '03', title: 'Assign the controller parameter groundings.', agent: 'Parameter Setter',
		description: 'The Parameter Setter replaces symbolic placeholders with numerical values inferred for the observed task and scene.',
		input: 'Abstract skill recipes', output: 'Parameter Groundings', color: 'parameter',
		outputGroups: [{ label: 'Parameter Groundings', code: true, items: ['Hover height (o_z): 0.15 m', 'Vertical offsets (o_x, o_y): 0.00 m', 'EEF angle offset (o_θ): 180°', 'Grasp depth (o_d): 0.02 m'] }],
	},
	{
		id: 'grounding', index: '04', title: 'Ground only the requested scene features.', agent: 'Vision Grounder',
		description: 'The Vision Grounder instantiates the keypoints and axes requested by the lifted skill as metric features in the current RGB-D scene.',
		input: 'Requested symbolic keypoints + axes', output: '3D Groundings', color: 'vision',
		outputGroups: [{ label: '3D Groundings', code: true, items: ['bottle_cap', 'box_inside', 'eef_tcp', 'eef_z_axis', 'bottle_cap_normal', 'bottle_inside_normal'] }],
	},
	{
		id: 'execution', index: '05', title: 'Compile the grounded skill into robot execution.', agent: 'Robot-agnostic execution interface',
		description: 'The grounded task-axis skill is compiled into an executable robot script whose controllers are evaluated at runtime.',
		input: 'Grounded task-axis skill', output: 'Executable robot script', color: 'execution',
		outputGroups: [{ label: 'Runtime Commands', items: ['Position', 'Orientation', 'Force', 'Gripper'] }],
	},
];

export const benchmarkTasks: BenchmarkTask[] = [
	{ title: 'Put the Ball into the Basket', shortTitle: 'Ball → basket', values: { oneSuccess: 90, zeroShot: 85, pi05: 55, capTac: 40, capPrimitive: 75 } },
	{ title: 'Put the Cube into the Drawer', shortTitle: 'Cube → drawer', values: { oneSuccess: 100, zeroShot: 85, pi05: 40, capTac: 45, capPrimitive: 60 } },
	{ title: 'Pick Up the Phone Call', shortTitle: 'Phone call', values: { oneSuccess: 100, zeroShot: 75, pi05: 5, capTac: 40, capPrimitive: 45 } },
	{ title: 'Iron the Tie', shortTitle: 'Iron tie', values: { oneSuccess: 85, zeroShot: 75, pi05: 0, capTac: 30, capPrimitive: 45 } },
	{ title: 'Put the Fruits into the White Bowl / Put the Others into the Pink Container', shortTitle: 'Separate objects', values: { oneSuccess: 85, zeroShot: 75, pi05: 5, capTac: 20, capPrimitive: 40 } },
	{ title: 'Close the Drawer', shortTitle: 'Close drawer', values: { oneSuccess: 90, zeroShot: 65, pi05: 10, capTac: 40, capPrimitive: 40 } },
	{ title: 'Grasp the Cup by the Handle and Gently Pour into the Box', shortTitle: 'Pour', values: { oneSuccess: 80, zeroShot: 55, pi05: 0, capTac: 15, capPrimitive: 0 } },
	{ title: 'Put the Ball into the Basket (Obstacle)', shortTitle: 'Obstacle', values: { oneSuccess: 95, zeroShot: 80, pi05: 35, capTac: 45, capPrimitive: 55 } },
	{ title: 'Erase the Red Scribble', shortTitle: 'Erase scribble', values: { oneSuccess: 100, zeroShot: 80, pi05: 40, capTac: 60, capPrimitive: 80 } },
	{ title: 'Start the Microwave', shortTitle: 'Microwave', values: { oneSuccess: 100, zeroShot: 75, pi05: 10, capTac: 30, capPrimitive: 50 } },
	{ title: 'Fix the Typo', shortTitle: 'Fix typo', values: { oneSuccess: 85, zeroShot: 75, pi05: 0, capTac: 35, capPrimitive: 50 } },
	{ title: 'Unscrew the Black Nut', shortTitle: 'Unscrew nut', values: { oneSuccess: 90, zeroShot: 75, pi05: 0, capTac: 40, capPrimitive: 50 } },
	{ title: 'Cut the Dough/Sponge with the Knife in Hand', shortTitle: 'Cut', values: { oneSuccess: 90, zeroShot: 75, pi05: 10, capTac: 20, capPrimitive: 5 } },
	{ title: 'Sweep the Trash into the Dustpan', shortTitle: 'Sweep', values: { oneSuccess: 80, zeroShot: 60, pi05: 0, capTac: 20, capPrimitive: 0 } },
];

export const feedbackProgression: FeedbackProgression[] = [
	{ title: 'Put the Ball into the Basket', rounds: [
		{ label: 'Zero-shot', success: 13, feedback: feedback(1, 1) }, { label: 'After One Feedback', success: 14, feedback: feedback(0, 0, 1) }, { label: 'After Two Feedbacks', success: 15, feedback: feedback() },
	] },
	{ title: 'Put the Cube into the Drawer', rounds: [
		{ label: 'Zero-shot', success: 13, feedback: feedback(1, 1) }, { label: 'After One Feedback', success: 14, feedback: feedback(0, 1) }, { label: 'After Two Feedbacks', success: 15, feedback: feedback() },
	] },
	{ title: 'Pick Up the Phone Call', rounds: [
		{ label: 'Zero-shot', success: 11, feedback: feedback(3, 1) }, { label: 'After One Feedback', success: 13, feedback: feedback(0, 2) }, { label: 'After Two Feedbacks', success: 15, feedback: feedback() },
	] },
	{ title: 'Iron the Tie', rounds: [
		{ label: 'Zero-shot', success: 11, feedback: feedback(1, 1, 2) }, { label: 'After One Feedback', success: 13, feedback: feedback(0, 0, 0, 2) }, { label: 'After Two Feedbacks', success: 15, feedback: feedback() },
	] },
	{ title: 'Put the Fruits into the White Bowl / Put the Others into the Pink Container', rounds: [
		{ label: 'Zero-shot', success: 11, feedback: feedback(0, 3, 1) }, { label: 'After One Feedback', success: 12, feedback: feedback(0, 0, 2, 1) }, { label: 'After Two Feedbacks', success: 15, feedback: feedback() },
	] },
	{ title: 'Close the Drawer', rounds: [
		{ label: 'Zero-shot', success: 10, feedback: feedback(0, 4, 0, 1) }, { label: 'After One Feedback', success: 12, feedback: feedback(0, 0, 1, 2) }, { label: 'After Two Feedbacks', success: 15, feedback: feedback() },
	] },
	{ title: 'Grasp the Cup by the Handle and Gently Pour into the Box', rounds: [
		{ label: 'Zero-shot', success: 8, feedback: feedback(0, 6, 0, 1) }, { label: 'After One Feedback', success: 11, feedback: feedback(0, 1, 0, 3) }, { label: 'After Two Feedbacks', success: 14, feedback: feedback(0, 0, 0, 1) }, { label: 'After Three Feedbacks', success: 15, feedback: feedback() },
	] },
	{ title: 'Put the Ball into the Basket (Obstacle)', rounds: [
		{ label: 'Zero-shot', success: 12, feedback: feedback(1, 0, 2) }, { label: 'After One Feedback', success: 13, feedback: feedback(0, 0, 0, 2) }, { label: 'After Two Feedbacks', success: 15, feedback: feedback() },
	] },
	{ title: 'Erase the Red Scribble', rounds: [
		{ label: 'Zero-shot', success: 12, feedback: feedback(1, 1, 1) }, { label: 'After One Feedback', success: 13, feedback: feedback(0, 0, 0, 2) }, { label: 'After Two Feedbacks', success: 15, feedback: feedback() },
	] },
	{ title: 'Start the Microwave', rounds: [
		{ label: 'Zero-shot', success: 11, feedback: feedback(0, 4) }, { label: 'After One Feedback', success: 13, feedback: feedback(0, 0, 1, 1) }, { label: 'After Two Feedbacks', success: 15, feedback: feedback() },
	] },
	{ title: 'Fix the Typo', rounds: [
		{ label: 'Zero-shot', success: 11, feedback: feedback(1, 2, 1) }, { label: 'After One Feedback', success: 14, feedback: feedback(0, 0, 0, 1) }, { label: 'After Two Feedbacks', success: 15, feedback: feedback() },
	] },
	{ title: 'Unscrew the Black Nut', rounds: [
		{ label: 'Zero-shot', success: 11, feedback: feedback(1, 1, 2) }, { label: 'After One Feedback', success: 13, feedback: feedback(0, 0, 0, 2) }, { label: 'After Two Feedbacks', success: 15, feedback: feedback() },
	] },
	{ title: 'Cut the Dough/Sponge with the Knife in Hand', rounds: [
		{ label: 'Zero-shot', success: 11, feedback: feedback(0, 3, 0, 1) }, { label: 'After One Feedback', success: 13, feedback: feedback(0, 0, 2) }, { label: 'After Two Feedbacks', success: 15, feedback: feedback() },
	] },
	{ title: 'Sweep the Trash into the Dustpan', rounds: [
		{ label: 'Zero-shot', success: 9, feedback: feedback(1, 2, 2, 1) }, { label: 'After One Feedback', success: 13, feedback: feedback(0, 0, 0, 2) }, { label: 'After Two Feedbacks', success: 14, feedback: feedback(0, 0, 0, 1) }, { label: 'After Three Feedbacks', success: 15, feedback: feedback() },
	] },
];

export const moreBehaviors: MoreBehavior[] = [
	{ id: 'marker-cup', title: 'Marker into a cup', category: 'Semantic placement', description: 'A compact open-world placement behavior from a direct language instruction.', video: '/media/more-marker-cup.mp4', poster: '/media/more-marker-cup-poster.jpg' },
	{ id: 'draw-square', title: 'Draw a square around the ball', category: 'Tool trajectory', description: 'A geometric drawing request becomes a constrained waypoint trajectory.', video: '/media/more-draw-square.mp4', poster: '/media/more-draw-square-poster.jpg' },
	{ id: 'unexpected-typo', title: 'A different interpretation', category: 'Instruction ambiguity', description: 'Given “Fix the typo,” GTA-2 arranges the loose letters into “TEACH” instead of correcting the word we had in mind. Well, that’s technically not incorrect…', video: '/media/more-unexpected-typo.mp4', poster: '/media/more-unexpected-typo-poster.jpg', feature: 'ambiguity' },
	{ id: 'pingpong-bowl', title: 'Ping-pong ball into a bowl', category: 'Precision placement', description: 'A small-object grasp and placement behavior with a narrow target region.', video: '/media/more-pingpong-bowl.mp4', poster: '/media/more-pingpong-bowl-poster.jpg' },
	{ id: 'ball-zone', title: 'Put the ball where it belongs', category: 'Semantic grounding', description: 'The system grounds a visually labeled destination from an underspecified request.', video: '/media/more-ball-zone.mp4', poster: '/media/more-ball-zone-poster.jpg' },
];

export const benchmarkMethods = [
	{ key: 'oneSuccess', label: 'One-Success GTA-2', short: 'One-Success' },
	{ key: 'zeroShot', label: 'Zero-Shot GTA-2', short: 'Zero-Shot' },
	{ key: 'pi05', label: 'Pi-0.5', short: 'Pi-0.5' },
	{ key: 'capTac', label: 'CaP-TAC', short: 'CaP-TAC' },
	{ key: 'capPrimitive', label: 'CaP-Primitive', short: 'CaP-Primitive' },
] as const;

export const agentLegend: Array<{ key: AgentKey; label: string; short: string }> = [
	{ key: 'task', label: 'Task Decomposer Feedback', short: 'T' },
	{ key: 'skill', label: 'Skill Generator Feedback', short: 'S' },
	{ key: 'parameter', label: 'Parameter Setter Feedback', short: 'P' },
	{ key: 'vision', label: 'Vision Module Feedback', short: 'V' },
];
