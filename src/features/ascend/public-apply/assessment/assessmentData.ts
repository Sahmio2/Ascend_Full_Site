export interface Stage {
  name: string;
  short: string;
  desc: string;
  code: string;
}

export interface QuestionCondition {
  id?: string;
  is?: unknown;
  in?: unknown[];
  flag?: string;
  profile?: string;
}

export interface Question {
  id: string;
  stage: number;
  prompt: string;
  type: string;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: string[];
  items?: string[];
  min?: number;
  max?: number;
  when?: QuestionCondition;
  detailWhen?: string[];
  detailLabel?: string;
  urgent?: boolean;
  maxSelect?: number;
  labels?: string[];
  groups?: Array<{ name: string; options: string[] }>;
}

export const stages: Stage[] = [
  { name: 'The First Truth', short: 'Your details', desc: 'Confirm your saved registration details and the essential privacy and coaching terms.', code: 'FT' },
  { name: 'The Body Speaks', short: 'Health & safety', desc: 'Tell us about pain, injuries and health concerns so Sahmi can work within what is safe.', code: 'BS' },
  { name: 'The Form You Seek', short: 'Your goal', desc: 'Describe the physique you want and your starting point.', code: 'FS' },
  { name: 'The Training You Carry', short: 'Training history', desc: 'What have you tried, and what usually makes consistency difficult?', code: 'TC' },
  { name: 'The Ground Beneath You', short: 'Your training setup', desc: 'Give us the time and equipment you can realistically use.', code: 'GB' },
  { name: 'The Movements That Fit', short: 'Movement choices', desc: 'Tell us which exercises you enjoy or would rather avoid.', code: 'MF' },
  { name: 'The Table You Return To', short: 'Your food reality', desc: 'Build around the Nigerian meals, food budget and kitchen you actually have.', code: 'TR' },
  { name: 'The Rhythm of Your Life', short: 'Lifestyle & recovery', desc: 'Help Sahmi balance training demands with the rest of your life.', code: 'RL' },
  { name: 'The Pact of Progress', short: 'Final details', desc: 'Share any final context, then confirm the information is accurate.', code: 'PP' }
];

const q = (id: string, stage: number, prompt: string, type: string, opts: Partial<Question> = {}): Question => ({
  id,
  stage,
  prompt,
  type,
  ...opts,
});

export const questions: Question[] = [
  q('FT-01', 0, 'Here’s what you told us. Does this look right?', 'imported', { required: true, help: 'Your original registration answers are shown below. Edit only a detail that has changed; you will not register again.' }),
  q('FT-02', 0, 'What is your exact age?', 'number', { required: true, min: 16, max: 100, placeholder: 'e.g. 24', help: 'We only need your age, not a date of birth.' }),
  q('FT-05', 0, 'Before continuing, confirm each statement.', 'checks', { required: true, items: ['I have read the ASCEND privacy notice.', 'I understand that ASCEND coaching does not provide medical care or emergency support.'], help: 'The final accuracy confirmation is at the end. Real consent requires a published notice and a secure versioned record; this is only a design demonstration.' }),
  
  q('BS-02', 1, 'Do you currently have pain, an injury or a movement that becomes painful during or after training?', 'choice', { required: true, options: ['No', 'Yes', 'Unsure'] }),
  q('BS-02A', 1, 'Where is it?', 'multi', { required: true, when: { id: 'BS-02', in: ['Yes', 'Unsure'] }, options: ['Neck', 'Shoulder', 'Elbow', 'Wrist', 'Upper back', 'Lower back', 'Hip', 'Groin', 'Knee', 'Ankle', 'Foot', 'Other'] }),
  q('BS-02B', 1, 'When did it begin, and what was happening at the time?', 'textarea', { required: true, when: { id: 'BS-02', in: ['Yes', 'Unsure'] }, placeholder: 'Only what you feel comfortable sharing.' }),
  q('BS-02C', 1, 'How strong is it at its worst?', 'rating', { required: true, min: 0, max: 10, when: { id: 'BS-02', in: ['Yes', 'Unsure'] }, help: '0 means no pain; 10 means the strongest imaginable pain.' }),
  q('BS-02D', 1, 'Which movements or activities bring it on?', 'textarea', { required: true, when: { id: 'BS-02', in: ['Yes', 'Unsure'] } }),
  q('BS-02E', 1, 'How does it feel later that day or the next morning?', 'choice', { required: true, when: { id: 'BS-02', in: ['Yes', 'Unsure'] }, options: ['Better', 'Same', 'Worse', 'Variable'] }),
  q('BS-02F', 1, 'Has a doctor, physiotherapist or other qualified professional assessed it?', 'choice', { required: true, when: { id: 'BS-02', in: ['Yes', 'Unsure'] }, options: ['No', 'Yes', 'Appointment planned'], detailWhen: ['Yes'], detailLabel: 'What relevant advice or restrictions were given? (optional)' }),
  q('BS-03', 1, 'Are you experiencing any locking, giving way, major swelling, inability to bear weight, numbness, tingling, unexplained weakness, or a hot/red joint with fever?', 'choice', { required: true, when: { id: 'BS-02', in: ['Yes', 'Unsure'] }, options: ['No', 'Yes', 'Unsure'], urgent: true, help: 'If these symptoms are present, stop exercise and seek appropriate qualified advice. If urgent, seek emergency services rather than waiting for a coach.' }),
  q('BS-04', 1, 'Is there a medication, treatment or health-related restriction affecting your food choices or recovery?', 'choice', { required: true, options: ['No', 'Yes', 'Unsure', 'Prefer private discussion'], detailWhen: ['Yes', 'Unsure', 'Prefer private discussion'], detailLabel: 'Only the additional coaching-relevant restriction, if you wish (optional)' }),
  q('BS-05', 1, 'Have you recently had surgery or been hospitalised in a way that might affect your exercise or recovery?', 'choice', { required: true, options: ['No', 'Yes', 'Unsure'], detailWhen: ['Yes', 'Unsure'], detailLabel: 'Approximate date, relevant exercise restrictions, or professional advice given (optional)' }),
  q('BS-07', 1, 'Would food tracking, calorie targets or body measurements be unsafe or harmful for you because of a current or past eating disorder or difficult relationship with food?', 'choice', { required: true, options: ['No', 'Yes', 'Unsure', 'Prefer private discussion'], urgent: true, help: 'If tracking foods or measurements is unsafe for you, ASCEND will not prescribe gram tracking or calorie targets. Sahmi can guide you using habit-based portions or advise if specialised clinical support is appropriate first.' }),

  q('FS-02', 2, 'Which two areas matter most to you right now?', 'multi', { required: true, maxSelect: 2, options: ['Chest & shoulders', 'Arms', 'Back & posture', 'Abs & waist', 'Glutes & legs', 'Overall muscular balance'] }),
  q('FS-03', 2, 'What would meaningful progress look like to you over the next three to six months?', 'textarea', { required: true, placeholder: 'Describe how your body looks or feels, clothing fit, confidence, strength...' }),
  q('FS-04', 2, 'What is your current height?', 'measurement', { required: true, help: 'Height helps estimate baseline calorie targets. Choose cm or feet/inches.' }),
  q('FS-05', 2, 'What is your current bodyweight?', 'measurement', { required: true, help: 'Morning weight before food or water is best. An estimate is fine if you do not have a scale.' }),
  q('FS-06', 2, 'Over the last four weeks, has your bodyweight mostly changed?', 'choice', { required: true, options: ['Staying about the same', 'Going down', 'Going up', 'Not sure / not tracking'] }),
  q('FS-07', 2, 'For your starting calorie estimate, which formula should we use? This only affects the maths, not how we coach you.', 'choice', { required: true, options: ['Male baseline', 'Female baseline', 'Skip calorie estimation for now'] }),
  q('BS-06', 2, 'Are you currently pregnant, postpartum or breastfeeding?', 'choice', { required: true, when: { id: 'FS-07', in: ['Female baseline'] }, options: ['No', 'Pregnant', 'Postpartum (under 12 months)', 'Breastfeeding'], urgent: true, help: 'Pregnancy and early postpartum recovery require qualified obstetric clearance before high-intensity gym training.' }),
  q('FS-10', 2, 'Is there a date or event Sahmi should know about?', 'choice', { required: true, options: ['No specific date', 'Wedding / celebration', 'Travel / holiday', 'Work milestone', 'Other'], detailWhen: ['Wedding / celebration', 'Travel / holiday', 'Work milestone', 'Other'], detailLabel: 'Approximate date or details (optional)' }),

  q('TC-01', 3, 'How long have you followed a structured training programme consistently?', 'choice', { required: true, options: ['Never followed one consistently', 'Less than 6 months', '6 to 24 months', 'More than 2 years'] }),
  q('TC-03', 3, 'Are you following a routine now?', 'choice', { required: true, options: ['Not training right now', 'Training inconsistently', 'Training regularly without a written plan', 'Following a written plan currently'] }),
  q('TC-04', 3, 'How confident do you feel training in the gym?', 'rating', { required: true, min: 1, max: 5, labels: ['New & intimidated', 'Somewhat hesitant', 'Comfortable with basics', 'Confident with most movements', 'Completely at home in any gym'] }),
  q('TC-05', 3, 'What most often interrupts your consistency?', 'multi', { required: true, options: ['Busy work or study hours', 'Low energy or poor sleep', 'Uncertainty about what exercises to do', 'Joint pain or injury recurrence', 'Family or social commitments', 'Loss of motivation when progress feels slow', 'Travel or routine disruption'] }),

  q('GB-01', 4, 'Which days can you realistically train most weeks?', 'multi', { required: true, options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], help: 'Choose realistic days, not your ideal timetable.' }),
  q('GB-02', 4, 'What is the longest session you can reliably complete?', 'choice', { required: true, options: ['30 minutes', '45 minutes', '60 minutes', '75 minutes', '90 minutes'] }),
  q('GB-04', 4, 'How predictable is your weekly schedule?', 'choice', { required: true, options: ['Mostly fixed', 'Changes sometimes', 'Changes every week'] }),
  q('GB-06', 4, 'Which equipment can you reliably use, and what is usually missing, crowded or limited?', 'equipment', { required: true, options: ['Dumbbells', 'Barbells', 'Bench', 'Rack', 'Cable machine', 'Selectorised machines', 'Resistance bands', 'Pull-up bar', 'Cardio machines', 'Bodyweight space', 'Other'], help: 'Select available equipment. Add any limitations like busy times or broken stations.' }),

  q('MF-03', 5, 'Are there exercises you love or want to avoid?', 'exercise', { required: true, help: 'You can choose "None" if you have no preferences. Pain-related concerns are considered with Stage 2.' }),

  q('TR-02', 6, 'Show us what a normal day of eating looks like, and which meals you want your plan to keep.', 'meals', { required: true, help: 'No need to weigh portions or know macros here. Think rice, beans, eba, yam, eggs, soup, plantain, snacks and drinks you actually eat.' }),
  q('TR-04', 6, 'Who usually prepares your food?', 'choice', { required: true, options: ['Me', 'Family or household', 'Partner', 'Vendor or restaurant', 'Mixed'], detailWhen: ['Family or household', 'Mixed'], detailLabel: 'Can the shared recipe usually be measured or separated? (optional)' }),
  q('TR-05', 6, 'What food budget is realistic for you?', 'budget', { required: true, help: 'Enter a realistic naira amount or range. Weekly or monthly is fine.' }),
  q('TR-06', 6, 'Do you have any food allergies, intolerances, or religious, cultural or personal food rules?', 'choice', { required: true, options: ['No', 'Yes', 'Unsure'], detailWhen: ['Yes', 'Unsure'], detailLabel: 'Which foods or rules must we respect?' }),
  q('TR-08', 6, 'Which foods do you dislike or refuse to eat?', 'textarea', { required: true, placeholder: 'Type None if none, or list foods you dislike or refuse to eat.' }),
  q('TR-09', 6, 'Which kitchen and storage tools can you reliably use?', 'multi', { required: true, options: ['Stove', 'Microwave', 'Oven', 'Fridge', 'Freezer', 'Blender', 'Containers', 'None', 'Other'] }),
  q('TR-11', 6, 'Which protein foods can you buy and eat regularly?', 'multi', { required: true, options: ['Eggs', 'Fish', 'Chicken', 'Beef', 'Beans', 'Soybeans', 'Milk / yoghurt', 'Groundnuts', 'Egusi / pumpkin seeds', 'Crayfish', 'Turkey', 'Tofu', 'Other'], help: 'Select what you can reliably access and afford in Nigeria.' }),
  q('TR-12', 6, 'How would you describe your appetite?', 'choice', { required: true, options: ['Low', 'Manageable', 'High', 'Changes often'], detailWhen: ['Low', 'Changes often'], detailLabel: 'What usually makes eating difficult? (optional)' }),
  q('TR-13', 6, 'If your plan requires it, how realistic is weighing selected foods?', 'choice', { required: true, options: ['Comfortable regularly', 'Only selected foods', 'Not realistic', 'I do not have a scale'], help: 'Your answer helps Sahmi choose a realistic approach. Your prescribed meals and swaps will still be written in grams.' }),

  q('RL-01', 7, 'How many hours do you sleep, and how well?', 'sleep', { required: true }),
  q('RL-04', 7, 'How physically and mentally demanding is your typical day (work, study, caregiving)?', 'workload', { required: true }),
  q('RL-06', 7, 'How are your energy and recovery most weeks?', 'recovery', { required: true }),
  q('RL-07', 7, 'Do you currently do cardio or another sport?', 'choice', { required: true, options: ['No', 'Yes'], detailWhen: ['Yes'], detailLabel: 'What activity, how many days and for how long? (optional details)' }),
  q('RL-08', 7, 'Do menstrual-cycle symptoms meaningfully affect your training energy, pain or recovery?', 'choice', { required: false, when: { id: 'FS-07', in: ['Female baseline'] }, options: ['No', 'Sometimes', 'Often', 'Prefer private discussion'], help: 'Optional; helps Sahmi adjust volume during tough weeks.' }),

  q('FT-04', 8, 'Would you like to add an emergency contact?', 'emergency', { required: false, help: 'Optional for adults. For anyone 16–17, verified guardian information is managed separately before access.' }),
  q('PP-03', 8, 'Is there a boundary, non-negotiable or anything else Sahmi should know before reviewing your assessment?', 'textarea', { required: false, placeholder: 'Optional. Share any personal boundary, travel dates, or questions for Sahmi.' }),
  q('PP-04', 8, 'I confirm that these answers are complete and accurate to the best of my knowledge, and that I will report material changes.', 'checks', { required: true, items: ['I confirm the information is accurate to the best of my knowledge.'] })
];

export function isQuestionVisible(question: Question, answers: Record<string, unknown>): boolean {
  if (!question.when) return true;
  const { id, is, in: inList } = question.when;
  if (!id) return true;
  const val = answers[id];
  if (is !== undefined) return val === is;
  if (inList !== undefined && Array.isArray(inList)) return inList.includes(val);
  return false;
}
