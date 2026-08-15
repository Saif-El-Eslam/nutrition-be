const localized = (en, ar) => ({ en, ar });

const sectionResultRanges = ({ excellent, good, average, priority }) => {
  const createRange = (range, fallbackRecommendation) => ({
    minScore: range.min,
    maxScore: range.max,
    label: localized(range.en, range.ar),
    description: localized(range.en, range.ar),
    recommendations: [
      localized(
        range.recommendation?.en ?? fallbackRecommendation.en,
        range.recommendation?.ar ?? fallbackRecommendation.ar,
      ),
    ],
  });

  const ranges = [];

  if (excellent) {
    ranges.push(
      createRange(excellent, {
        en: "Keep this strength and build on it.",
        ar: "استمر على هذا المستوى ووسع نقاط القوة هذه.",
      }),
    );
  }

  if (good) {
    ranges.push(
      createRange(good, {
        en: "There is room to improve these habits.",
        ar: "هناك مساحة لتحسين هذه العادات.",
      }),
    );
  }

  if (average) {
    ranges.push(
      createRange(average, {
        en: "Focus on small adjustments to move forward.",
        ar: "ركز على تعديلات صغيرة للتقدم.",
      }),
    );
  }

  if (priority) {
    ranges.push(
      createRange(priority, {
        en: "This area needs priority attention.",
        ar: "هذا الجانب يحتاج إلى اهتمام أولوية.",
      }),
    );
  }

  return ranges;
};

const score = (values) => values;

export const assessmentFormSeed = {
  title: localized("Nutrition Assessment Survey", "استبيان التقييم الغذائي"),
  description: localized(
    "A nutrition and lifestyle assessment form.",
    "تقييم العادات الغذائية ونمط الحياة",
  ),
  sections: [
    {
      title: localized("Your Goal and Current State", "هدفك وحالتك الحالية"),
      description: localized(
        "This section helps understand how clear your goal is and how your weight has responded before.",
        "يساعد هذا القسم على فهم وضوح هدفك وطريقة استجابة وزنك سابقًا.",
      ),
      order: 1,
      questions: [
        {
          text: localized(
            "How clear is your goal for the current follow-up?",
            "ما مدى وضوح هدفك من المتابعة الحالية",
          ),
          order: 1,
          choices: [
            {
              text: localized(
                "A specific clear goal with a realistic timeframe",
                "هدف محدد وواضح ومعه إطار زمني واقعي",
              ),
              score: 1,
            },
            {
              text: localized(
                "A clear goal but without a set timeframe",
                "هدف واضح لكن دون إطار زمني محدد",
              ),
              score: 2,
            },
            {
              text: localized(
                "A general idea of the goal; I need to define it more",
                "فكرة عامة عن الهدف وأحتاج لتحديدها أكثر",
              ),
              score: 2,
            },
            {
              text: localized(
                "I haven't set a clear goal yet",
                "لم أحدد هدفًا واضحًا حتى الآن",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "How did your weight respond in previous attempts?",
            "كيف كانت استجابة وزنك في محاولاتك السابقة",
          ),
          order: 2,
          choices: [
            {
              text: localized(
                "It decreases or stabilizes as expected when I organize my eating",
                "ينزل أو يثبت بشكل متوقع عند تنظيم الأكل",
              ),
              score: 1,
            },
            {
              text: localized(
                "It decreases slowly and needs more time than usual",
                "ينزل ببطء ويحتاج وقتًا أطول من المعتاد",
              ),
              score: 2,
            },
            {
              text: localized(
                "It drops then returns quickly after stopping",
                "ينزل ثم يعود بسرعة بعد التوقف",
              ),
              score: 2,
            },
            {
              text: localized(
                "It changes unpredictably and is hard to control",
                "يتغير بشكل غير متوقع ويصعب التحكم فيه",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "How would you describe your weight stability during the last six months?",
            "كيف تصف ثبات وزنك خلال آخر ستة أشهر",
          ),
          order: 3,
          choices: [
            {
              text: localized(
                "Stable most of the time with no disturbing changes",
                "ثابت إلى حد كبير دون تغيرات مزعجة",
              ),
              score: 1,
            },
            {
              text: localized(
                "Small changes within a few kilograms",
                "تغيرات بسيطة في حدود كيلوجرامات قليلة",
              ),
              score: 2,
            },
            {
              text: localized(
                "Noticeable ups and downs",
                "تغيرات ملحوظة صعودًا وهبوطًا",
              ),
              score: 2,
            },
            {
              text: localized(
                "A large change that is hard to explain or control",
                "تغير كبير يصعب تفسيره أو ضبطه",
              ),
              score: 3,
            },
          ],
        },
      ],
      resultRanges: sectionResultRanges({
        excellent: {
          en: "Excellent",
          ar: "ممتاز",
          min: 0,
          max: 3,
          recommendation: localized(
            "At this level, your goal is clear and your body has the ability to respond well. Having a specific goal with a stable weight history makes evaluating your status easier and increases the chances of success. The advice here is to focus on steps that suit your goal, rather than trying to change everything all at once. If your goal is weight loss, identify the habit with the biggest impact and focus on it; if you are looking to gain weight or build muscle, the most important thing is to stabilize your eating and activity patterns.",
            "في هذا المستوى، يكون الهدف واضحاً وجسمك يمتلك القدرة على الاستجابة بشكل جيد. وجود هدف محدد مع تاريخ وزن مستقر يجعل تقييم الحالة أكثر سهولة ويزيد من فرص النجاح. النصيحة هنا تكمن في التركيز على خطوات ملائمة لهدفك، بدلاً من محاولة تغيير كل شيء دفعة واحدة. فإذا كان هدفك فقدان الوزن، فحدد العادة ذات التأثير الأكبر وركز عليها، أما إذا كنت تسعى لزيادة الوزن أو بناء العضلات، فالأهم هو تثبيت نمط الأكل والنشاط.",
          ),
        },
        good: {
          en: "Good",
          ar: "جيد",
          min: 4,
          max: 5,
          recommendation: localized(
            "The level is good, but there are some details that might hinder achieving the desired results. The goal is clear, but past weight responsiveness requires a deeper analysis. Focus should be placed on recurring causes, such as rapid weight gain, which might be related to your daily routine and not just the quality of food. Understanding your body's trends helps reduce psychological stress and achieve better results.",
            "المستوى جيد، إلا أن هناك بعض التفاصيل التي قد تعيق تحقيق النتائج المرجوة. الهدف واضح، لكن استجابة الوزن السابقة تستدعي تحليلاً أعمق. ينبغي التركيز على الأسباب المتكررة، كزيادة الوزن السريعة، والتي قد تعود إلى روتنيك اليومي وليس فقط لنوعية الطعام. فهم اتجاه جسمك يساعد على تخفيف الضغط النفسي وتحقيق نتائج أفضل.",
          ),
        },
        average: {
          en: "Average",
          ar: "متوسط",
          min: 6,
          max: 7,
          recommendation: localized(
            "This level indicates that your body needs finer regulation before starting a new plan. Having a goal along with unstable weight fluctuations shows the necessity of building a simple foundation that helps stabilize weight. Adjusting meal timings, daily activity, and improving sleep quality can have a deeper impact than making drastic, temporary decisions.",
            "هذا المستوى يشير إلى حاجة جسمك إلى تنظيم أدق قبل الشروع في خطة جديدة. وجود هدف مع تغير غير مستقر في الوزن يدل على ضرورة بناء أساس بسيط يساعد على استقرار الوزن. ضبط مواعيد الأكل، النشاط اليومي، وتحسين جودة النوم قد يكون لها تأثير أعمق من اتخاذ قرارات جذرية ومؤقتة.",
          ),
        },
        priority: {
          en: "Needs Attention",
          ar: "يحتاج لاهتمام",
          min: 8,
          max: 9,
          recommendation: localized(
            "At this level, the body needs utmost care, as weight may be difficult to control or changes in a frustrating manner. The solution is not always to reduce food intake; instead, you must first understand the root cause behind this condition, such as lack of movement, sleep disturbances, appetite, or the impact of past dieting experiences. Identifying the cause paves the way to modify the plan more effectively and achieve fruitful results.",
            "في هذا المستوى، يحتاج الجسم إلى عناية فائقة، إذ قد يكون الوزن صعب التحكم فيه أو يتغير بصورة مزعجة. الحل ليس دائماً في تقليل الطعام، بل يجب أولاً فهم السبب الحقيقي وراء هذه الحالة، مثل قلة الحركة، اضطرابات النوم، الشهية، أو تأثير تجارب الحمية السابقة. التعرف على السبب يمهد الطريق لتعديل الخطة بشكل أكثر فعالية وتحقيق نتائج مثمرة.",
          ),
        },
      }),
    },
    {
      title: localized(
        "Your Physical Activity and Daily Routine",
        "نشاطك البدني ونمط يومك",
      ),
      description: localized(
        "This section reads your daily movement and how it affects your energy and calorie use.",
        "يقرأ هذا القسم حركتك اليومية وتأثيرها على طاقتك واستهلاك جسمك للطاقة.",
      ),
      order: 2,
      questions: [
        {
          text: localized(
            "How many days per week do you practice intentional physical activity like walking or exercise?",
            "كم يومًا في الأسبوع تمارس فيه نشاطًا بدنيًا مقصودًا مثل المشي أو التمرين",
          ),
          order: 1,
          choices: [
            {
              text: localized("Five days or more", "خمسة أيام أو أكثر"),
              score: 1,
            },
            {
              text: localized("Three to four days", "ثلاثة إلى أربعة أيام"),
              score: 2,
            },
            { text: localized("One to two days", "يوم إلى يومين"), score: 2 },
            {
              text: localized(
                "Rarely or not at all",
                "نادرًا أو لا أمارس نشاطًا",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "How would you describe your day in terms of movement?",
            "كيف تصف طبيعة يومك من حيث الحركة",
          ),
          order: 2,
          choices: [
            {
              text: localized(
                "Very active most of the day",
                "كثير الحركة معظم اليوم",
              ),
              score: 1,
            },
            {
              text: localized(
                "Moderate movement with periods of sitting",
                "حركة معتدلة مع فترات جلوس",
              ),
              score: 2,
            },
            {
              text: localized(
                "Long sitting with limited movement",
                "جلوس طويل مع حركة محدودة",
              ),
              score: 2,
            },
            {
              text: localized(
                "Almost continuous sitting most of the day",
                "جلوس شبه متواصل معظم اليوم",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "Do you move after main meals, such as a short walk?",
            "هل تتحرك بعد الوجبات الرئيسية مثل المشي القصير",
          ),
          order: 3,
          choices: [
            {
              text: localized(
                "Often after most meals",
                "غالبًا بعد معظم الوجبات",
              ),
              score: 1,
            },
            {
              text: localized(
                "Sometimes after some meals",
                "أحيانًا بعد بعض الوجبات",
              ),
              score: 2,
            },
            {
              text: localized("Rarely do I do that", "نادرًا ما أفعل ذلك"),
              score: 2,
            },
            {
              text: localized(
                "I never move after meals",
                "لا أتحرك بعد الوجبات إطلاقًا",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "How do you describe your activity level and approximate daily steps?",
            "كيف تصف مستوى نشاطك وعدد خطواتك اليومية تقريبًا",
          ),
          order: 4,
          choices: [
            {
              text: localized("Active throughout the day", "ونشط طوال اليوم"),
              score: 1,
            },
            {
              text: localized(
                "Moderate with acceptable movement",
                "متوسط مع حركة مقبولة",
              ),
              score: 2,
            },
            {
              text: localized(
                "Low with little movement",
                "منخفض مع حركة قليلة",
              ),
              score: 2,
            },
            {
              text: localized(
                "Very little, mostly no movement",
                "قليل جدًا ومعظم اليوم بلا حركة",
              ),
              score: 3,
            },
          ],
        },
      ],
      resultRanges: sectionResultRanges({
        excellent: {
          en: "Excellent",
          ar: "ممتاز",
          min: 0,
          max: 4,
          recommendation: localized(
            "At this level, your daily body movement is very good, which enhances your body's ability to consume energy effectively throughout the day, rather than relying solely on dietary adjustments for weight control. It is recommended to maintain this level of activity and link it to your health goals. For example, if you walk regularly, this supports achieving your goals, provided you maintain a balanced diet and adequate sleep to achieve tangible and clear results.",
            "في هذا المستوى، تكون حركة جسمك اليومية جيدة جداً، مما يعزز قدرة جسمك على استهلاك الطاقة بشكل فعال طوال اليوم، بدلاً من الاعتماد فقط على ضبط النظام الغذائي للتحكم في الوزن. يُنصح بالحفاظ على هذا المستوى من النشاط وربطه بأهدافك الصحية. على سبيل المثال، إذا كنت تمارس المشي بشكل منتظم، فإن ذلك يدعم تحقيق أهدافك، شرط مراعاة تناول غذاء متوازن ونوم كافٍ لتحقيق نتائج ملموسة وواضحة.",
          ),
        },
        good: {
          en: "Good",
          ar: "جيد",
          min: 5,
          max: 6,
          recommendation: localized(
            "This level shows good physical activity, but there are periods of the day that require increased movement. You may exercise occasionally, but long periods of sitting during the rest of the day negatively impact results. It is recommended to focus on introducing small, frequent movements throughout the day, such as light walking after meals, as these continuous movements enhance the effectiveness of your physical activity and support a better weight balance, without the need to significantly increase exercise intensity.",
            "يظهر هذا المستوى وجود نشاط بدني جيد، لكن هناك فترات من اليوم تحتاج إلى زيادة الحركة. قد تمارس التمارين الرياضية أحياناً، إلا أن فترات الجلوس الطويلة خلال بقية اليوم تؤثر سلباً على النتائج. يُنصح بالتركيز على إدخال حركات صغيرة ومتكررة خلال اليوم، مثل المشي البسيط بعد الوجبات، حيث أن هذه التحركات المستمرة تعزز من فعالية نشاطك البدني وتدعم توازن وزنك بشكل أفضل، دون الحاجة إلى زيادة شدة التمارين بشكل ملحوظ.",
          ),
        },
        average: {
          en: "Average",
          ar: "متوسط",
          min: 7,
          max: 9,
          recommendation: localized(
            "This level indicates that your daily movement rate is insufficient to achieve your health goals, as your body spends a long time in a low-activity state, which explains the slow progress in achieving the desired results. It is necessary to increase daily movement gradually and regularly before resorting to intense or complex exercises, because the goal is to stimulate the body to move continuously throughout the day, not just during a specific period of the week.",
            "يشير هذا المستوى إلى أن معدل الحركة اليومي غير كافٍ لتحقيق أهدافك الصحية، حيث يقضي جسمك وقتاً طويلاً في حالة نشاط منخفض، مما يفسر بطء تحقيق النتائج المرجوة. من الضروري زيادة الحركة اليومية بشكل تدريجي ومنتظم قبل اللجوء إلى تمارين مكثفة أو معقدة، لأن الهدف هو تحفيز الجسم على الحركة المستمرة طوال اليوم، وليس فقط خلال فترة زمنية محددة من الأسبوع.",
          ),
        },
        priority: {
          en: "Needs Attention",
          ar: "يحتاج لاهتمام",
          min: 10,
          max: 12,
          recommendation: localized(
            "This level expresses a clear decrease in your physical activity, where sitting for long periods reduces the body's energy consumption, even with a balanced diet. Therefore, your body needs simple and frequent daily stimulation for movement. It is recommended to focus on the simplest possible changes, such as walking for ten minutes after lunch, as this is considered more effective than waiting for the perfect time to exercise, and consistently helps improve energy consumption and overall body health.",
            "يعبر هذا المستوى عن انخفاض واضح في نشاطك البدني، حيث يؤدي الجلوس لفترات طويلة إلى تقليل استهلاك الجسم للطاقة، حتى مع نظام غذائي متوازن. لذلك، يحتاج جسمك إلى تحفيز يومي بسيط ومتكرر للحركة. يُنصح بالتركيز على أبسط التغييرات الممكنة، مثل المشي لمدة عشر دقائق بعد الغداء، إذ يعتبر ذلك أكثر فعالية من انتظار الوقت المثالي لممارسة التمارين الرياضية، ويساعد بشكل مستمر على تحسين استهلاك الطاقة وصحة الجسم بشكل عام.",
          ),
        },
      }),
    },
    {
      title: localized(
        "Your Sleep, Hydration and Daily Energy",
        "نومك وماؤك وطاقتك اليومية",
      ),
      description: localized(
        "This section reads your sleep quality, hydration, and energy levels during the day.",
        "يقرأ هذا القسم جودة نومك وترطيب جسمك ومستوى طاقتك خلال اليوم.",
      ),
      order: 3,
      questions: [
        {
          text: localized(
            "How many hours do you sleep on average per day?",
            "كم ساعة تنام في المتوسط يوميًا",
          ),
          order: 1,
          choices: [
            {
              text: localized(
                "Seven to eight hours regularly",
                "سبع إلى ثماني ساعات بانتظام",
              ),
              score: 1,
            },
            {
              text: localized(
                "Six to seven hours approximately",
                "ست إلى سبع ساعات تقريبًا",
              ),
              score: 2,
            },
            {
              text: localized("Five to six hours", "خمسة إلى ست ساعات"),
              score: 2,
            },
            {
              text: localized(
                "Less than five hours or irregular sleep",
                "أقل من خمس ساعات أو نوم غير منتظم",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "How many cups of water do you drink per day approximately?",
            "كم كوب ماء تشرب يوميًا تقريبًا",
          ),
          order: 2,
          choices: [
            {
              text: localized(
                "Eight cups or more regularly",
                "ثمانية أكواب أو أكثر بانتظام",
              ),
              score: 1,
            },
            {
              text: localized("Five to seven cups", "خمسة إلى سبعة أكواب"),
              score: 2,
            },
            {
              text: localized("Three to four cups", "ثلاثة إلى أربعة أكواب"),
              score: 2,
            },
            {
              text: localized(
                "Less than three cups or often forget to drink",
                "أقل من ثلاثة أكواب أو أنسى الشرب غالبًا",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "How would you describe your energy level during the day?",
            "كيف تصف مستوى طاقتك خلال اليوم",
          ),
          order: 3,
          choices: [
            {
              text: localized(
                "Good and steady energy most of the day",
                "طاقة جيدة وثابتة معظم اليوم",
              ),
              score: 1,
            },
            {
              text: localized(
                "Good energy with some dips",
                "طاقة جيدة مع بعض الهبوط",
              ),
              score: 2,
            },
            {
              text: localized(
                "Frequent tiredness needing a lot of rest",
                "تعب متكرر يحتاج لراحة كثيرة",
              ),
              score: 2,
            },
            {
              text: localized(
                "Exhaustion most of the day affecting my activity",
                "إرهاق معظم اليوم يؤثر على نشاطي",
              ),
              score: 3,
            },
          ],
        },
      ],
      resultRanges: sectionResultRanges({
        excellent: {
          en: "Excellent",
          ar: "ممتاز",
          min: 0,
          max: 3,
          recommendation: localized(
            "At this level, your sleep quality, body hydration, and energy level are in a very good state, giving your body the ability to handle the demands of the day efficiently and without excess stress. These factors form a strong foundation that supports overall health and prepares the body for optimal performance in various activities.",
            "في هذا المستوى، تكون جودة نومك، وترطيب جسمك، ومستوى طاقتك في حالة جيدة جداً، مما يمنح جسمك القدرة على التعامل مع متطلبات اليوم بكفاءة وبدون ضغوط زائدة. هذه العوامل تشكل أساساً قوياً يدعم الصحة العامة ويهيئ الجسم لأداء مثالي في مختلف الأنشطة.",
          ),
        },
        good: {
          en: "Good",
          ar: "جيد",
          min: 4,
          max: 5,
          recommendation: localized(
            "This level shows general acceptability, but there are fine details that may affect your focus and appetite, such as irregular water intake or reducing sleep duration by half an hour. It is recommended to focus on the aspect that shows the greatest impact on your day; if you wake up tired, start by improving sleep quality, but if you tend to forget to drink water, make a water bottle available in front of you throughout the day to enhance hydration.",
            "يظهر هذا المستوى قبولاً عاماً، إلا أن هناك تفاصيل دقيقة قد تؤثر على تركيزك وشهيتك، مثل عدم انتظام شرب المياه أو تقليل مدة النوم بمقدار نصف ساعة. يُنصح بالتركيز على الجانب الذي يظهر تأثيره الأكبر في يومك؛ فإذا كنت تستيقظ متعباً، فابدأ بتحسين جودة النوم، أما إذا كنت تميل إلى نسيان شرب الماء، فاجعل زجاجة الماء متاحة أمامك طوال اليوم لتعزيز الترطيب.",
          ),
        },
        average: {
          en: "Average",
          ar: "متوسط",
          min: 6,
          max: 7,
          recommendation: localized(
            "This level indicates that your body may not be getting enough rest. Lack of sleep or poor hydration may manifest through increased feelings of hunger, low energy, or constant fatigue. It is essential to focus on stabilizing these vital foundations before getting preoccupied with the details of the diet, as an exhausted or unhydrated body finds it difficult to commit to a health plan, even if it is suitable.",
            "يدل هذا المستوى على أن جسمك قد لا يحصل على الراحة الكافية. نقص النوم أو ضعف الترطيب قد يظهران من خلال زيادة الشعور بالجوع، انخفاض الطاقة، أو التعب المستمر. من الضروري التركيز على استقرار هذه الأسس الحيوية قبل الانشغال بتفاصيل النظام الغذائي، إذ إن الجسم المرهق أو غير المرتوي يصعب عليه الالتزام بالخطة الصحية حتى لو كانت ملائمة.",
          ),
        },
        priority: {
          en: "Needs Attention",
          ar: "يحتاج لاهتمام",
          min: 8,
          max: 9,
          recommendation: localized(
            "At this level, your body needs rapid intervention in the areas of sleep, hydration, and energy. Often, your day begins when you are not sufficiently prepared for changes, which reflects in your feeling of exhaustion, fatigue, and difficulty adhering to the diet. It is recommended to focus initially on fixing just one aspect; if sleep is less than five hours, start by improving it, and if hydration is very weak, increase it gradually. This change will have a clear positive impact on the rest aspects of your health and performance.",
            "في هذا المستوى، يحتاج جسمك إلى تدخل سريع في مجالات النوم والترطيب والطاقة. غالباً ما يبدأ يومك وأنت غير مستعد بشكل كافٍ للتغييرات، مما ينعكس على شعورك بالإرهاق، التعب، وصعوبة الالتزام بالحمية الغذائية. يُنصح بالتركيز في البداية على إصلاح جانب واحد فقط، فإذا كان النوم يقل عن خمس ساعات، فابدأ بتحسينه، وإذا كان الترطيب ضعيفاً جداً، فقم بزيادته تدريجياً. هذا التغيير سيكون له تأثير إيجابي واضح على باقي جوانب صحتك وأدائك.",
          ),
        },
      }),
    },
    {
      title: localized("Appetite and Meal Timing", "الشهية وتوقيت الأكل"),
      description: localized(
        "This section reads your hunger, meal timing, and eating without real hunger.",
        "يقرأ هذا القسم شعورك بالجوع وتوقيته وميلك للأكل دون جوع حقيقي.",
      ),
      order: 4,
      questions: [
        {
          text: localized(
            "Do you distinguish between true hunger and eating desire without hunger?",
            "هل تميز بين الجوع الحقيقي والرغبة في الأكل دون جوع",
          ),
          order: 1,
          choices: [
            {
              text: localized(
                "I distinguish clearly most of the time",
                "أميز بينهما بوضوح في معظم الأوقات",
              ),
              score: 1,
            },
            {
              text: localized(
                "I mostly distinguish with some confusion",
                "أميز بينهما غالبًا مع بعض الالتباس",
              ),
              score: 2,
            },
            {
              text: localized(
                "It is difficult for me to distinguish",
                "يصعب علي التمييز بينهما كثيرًا",
              ),
              score: 2,
            },
            {
              text: localized(
                "I often eat without knowing if I am really hungry",
                "آكل غالبًا دون أن أعرف إن كنت جائعًا فعلاً",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "When is your appetite usually at its highest?",
            "متى تكون شهيتك في أعلى مستوى عادة",
          ),
          order: 2,
          choices: [
            {
              text: localized(
                "Balanced throughout the day",
                "موزعة بشكل متوازن على مدار اليوم",
              ),
              score: 1,
            },
            {
              text: localized(
                "Slightly higher at a manageable time",
                "تزيد قليلًا في وقت محدد يمكن التعامل معه",
              ),
              score: 2,
            },
            {
              text: localized(
                "Clearly higher in the evening or night",
                "تزيد بوضوح في المساء أو الليل",
              ),
              score: 2,
            },
            {
              text: localized(
                "Strong and frequent, hard to control",
                "تزيد بشكل قوي ومتكرر يصعب ضبطه",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "Do you sometimes eat due to busyness or boredom without hunger?",
            "هل تأكل أحيانًا بسبب الانشغال أو الملل دون جوع",
          ),
          order: 3,
          choices: [
            { text: localized("Very rarely", "نادرًا جدًا"), score: 1 },
            {
              text: localized(
                "Sometimes in specific situations",
                "أحيانًا في مواقف محددة",
              ),
              score: 2,
            },
            {
              text: localized("Often during the week", "كثيرًا خلال الأسبوع"),
              score: 2,
            },
            {
              text: localized("Almost all the time", "معظم الوقت تقريبًا"),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "What is the usual gap between your main meals?",
            "ما الفترة بين وجباتك الرئيسية عادة",
          ),
          order: 4,
          choices: [
            {
              text: localized(
                "Regular and appropriate intervals",
                "فترات منتظمة ومناسبة",
              ),
              score: 1,
            },
            {
              text: localized(
                "Mostly regular with slight variation",
                "منتظمة غالبًا مع تفاوت بسيط",
              ),
              score: 2,
            },
            {
              text: localized(
                "Sometimes long and causes strong hunger",
                "طويلة أحيانًا وتسبب جوعًا شديدًا",
              ),
              score: 2,
            },
            {
              text: localized(
                "Irregular and I stay long hours without eating",
                "غير منتظمة وأبقى ساعات طويلة بلا أكل",
              ),
              score: 3,
            },
          ],
        },
      ],
      resultRanges: sectionResultRanges({
        excellent: {
          en: "Excellent",
          ar: "ممتاز",
          min: 0,
          max: 4,
          recommendation: localized(
            "At this level, your appetite is well-balanced, as you are usually able to distinguish between true hunger and emotional cravings for food, making it easier to control your daily eating pattern. It is recommended to maintain this delicate balance, and monitor the meals that precede periods of increased appetite instead of blaming willpower alone, especially if you notice an increase in hunger at certain times of the day.",
            "في هذا المستوى، تكون شهيتك متوازنة بشكل جيد، حيث تتمكن غالباً من التمييز بين الجوع الحقيقي والرغبة العاطفية في تناول الطعام، مما يسهل عليك التحكم في نمط تناولك اليومي. يُنصح بالحفاظ على هذا التوازن الدقيق، ومراقبة الوجبات التي تسبق فترات زيادة الشهية بدلاً من إلقاء اللوم على الإرادة فقط، خاصة إذا لاحظت زيادة في الشعور بالجوع في أوقات معينة من اليوم.",
          ),
        },
        good: {
          en: "Good",
          ar: "جيد",
          min: 5,
          max: 6,
          recommendation: localized(
            "This level represents an acceptable state, but there are specific situations that may drive you to eat without a clear feeling of hunger, often happening while busy or late in the day. It is important to pay attention to the timing of hunger; for example, if it increases at night, the reason might be insufficient meals during the day or long intervals between meals.",
            "يمثل هذا المستوى حالة مقبولة، لكن هناك مواقف محددة قد تدفعك إلى تناول الطعام دون شعور واضح بالجوع، وغالباً ما يحدث ذلك أثناء الانشغال أو في أواخر اليوم. من المهم الانتباه إلى توقيت الشعور بالجوع، فمثلاً إذا كان يزيد في الليل، فقد يكون السبب عدم كفاية الوجبات خلال النهار أو وجود فترات طويلة بين الوجبات.",
          ),
        },
        average: {
          en: "Average",
          ar: "متوسط",
          min: 7,
          max: 9,
          recommendation: localized(
            "This level indicates that the body's appetite needs better regulation, as hunger may appear strongly and variably, or disappear for a while and then return more intensely. It is necessary to focus on the regularity of meal timings rather than responding to hunger when it appears suddenly. Usually, it is easier to control food quantity and quality when the body gets used to fixed times for eating.",
            "يشير هذا المستوى إلى أن شهية الجسم بحاجة إلى تنظيم أفضل، حيث قد يظهر الجوع بشكل قوي ومتفاوت، أو يختفي لفترة ثم يعود بصورة أشد. من الضروري التركيز على انتظام مواعيد الوجبات بدلاً من الاستجابة للجوع عند ظهوره بشكل مفاجئ. عادة ما يسهل التحكم في كمية الطعام وجودته عندما يعتاد الجسم على مواعيد ثابتة للأكل.",
          ),
        },
        priority: {
          en: "Needs Attention",
          ar: "يحتاج لاهتمام",
          min: 10,
          max: 12,
          recommendation: localized(
            "At this level, the body's appetite and meal timing organization require urgent attention, as eating often occurs at times unrelated to true hunger, or after long periods of refraining from food. It is recommended to build a clear and regular daily schedule for meals, without the need for complex plans, so that the body is not left for long hours without food, which helps avoid overeating large quantities at late hours.",
            "في هذا المستوى، تحتاج شهية الجسم وتنظيم مواعيد الأكل إلى اهتمام عاجل، حيث يحدث تناول الطعام غالباً في أوقات غير مرتبطة بالجوع الحقيقي، أو بعد فترات طويلة من الامتناع عن الأكل. يُنصح ببناء برنامج يومي واضح ومنتظم للوجبات، دون الحاجة إلى خطط معقدة، بحيث لا يُترك الجسم لساعات طويلة دون طعام، مما يساهم في تفادي الإفراط في تناول كميات كبيرة في أوقات متأخرة.",
          ),
        },
      }),
    },
    {
      title: localized(
        "Your Relationship with Food and Adherence",
        "علاقتك بالأكل والالتزام",
      ),
      description: localized(
        "This section reads how you handle sweets, start diets, and why you stop.",
        "يقرأ هذا القسم تعاملك مع الحلويات وطريقة بدء الأنظمة الغذائية وأسباب التوقف.",
      ),
      order: 5,
      questions: [
        {
          text: localized(
            "How do you deal with sweets in your day?",
            "كيف تتعامل مع الحلويات في يومك",
          ),
          order: 1,
          choices: [
            {
              text: localized(
                "I eat them moderately without affecting my plan",
                "أتناولها باعتدال دون أن تؤثر على نظامي",
              ),
              score: 1,
            },
            {
              text: localized(
                "I sometimes eat more than usual then return to my path",
                "أتناولها أكثر من المعتاد أحيانًا ثم أعود لمساري",
              ),
              score: 2,
            },
            {
              text: localized(
                "I find it hard to stop after starting them",
                "أجد صعوبة في التوقف بعد البدء فيها",
              ),
              score: 2,
            },
            {
              text: localized(
                "I eat them a lot and it's hard to control",
                "أتناولها بكثرة ويصعب التحكم فيها",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "When starting any diet, how is your adherence?",
            "عند بدء أي نظام غذائي كيف يكون التزامك",
          ),
          order: 2,
          choices: [
            {
              text: localized(
                "I start and continue steadily for a good period",
                "أبدأ وأستمر بثبات لفترة جيدة",
              ),
              score: 1,
            },
            {
              text: localized(
                "I start with enthusiasm then gradually decrease",
                "أبدأ بحماس ثم يقل تدريجيًا",
              ),
              score: 2,
            },
            {
              text: localized(
                "I often stop after a few days",
                "أتوقف بعد أيام قليلة غالبًا",
              ),
              score: 2,
            },
            {
              text: localized(
                "I find it difficult to start at all",
                "أجد صعوبة في البدء من الأساس",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "What is the most frequent reason you stop adhering?",
            "ما السبب الأكثر تكرارًا لتوقفك عن الالتزام",
          ),
          order: 3,
          choices: [
            { text: localized("I rarely stop", "نادرًا ما أتوقف"), score: 1 },
            {
              text: localized(
                "Slow results or boredom",
                "قلة النتائج السريعة أو الملل",
              ),
              score: 2,
            },
            {
              text: localized(
                "Life pressure or lack of time",
                "ضغوط الحياة أو ضيق الوقت",
              ),
              score: 2,
            },
            {
              text: localized(
                "I stop for multiple repeated reasons",
                "أتوقف لأسباب متعددة ومتكررة",
              ),
              score: 3,
            },
          ],
        },
      ],
      resultRanges: sectionResultRanges({
        excellent: {
          en: "Excellent",
          ar: "ممتاز",
          min: 0,
          max: 3,
          recommendation: localized(
            "This level is characterized by a clear strength in control and commitment regarding your relationship with food, which makes executing any nutritional plan easier and more effective. It is recommended to utilize this strength in a realistic and balanced way; even if you tend to eat sweets, the awareness to control them and the ability to continue without allowing a single day to turn into a complete derailment is one of the fundamental pillars for maintaining healthy balance.",
            "يمتاز هذا المستوى بقوة واضحة في التحكم والالتزام بعلاقتك مع الطعام، مما يجعل تنفيذ أي خطة غذائية أكثر سهولة وفعالية. يُنصح بالاستفادة من هذه القوة بطريقة واقعية ومتزنة، فحتى إذا كنت تميل إلى تناول الحلويات، فإن الوعي بالتحكم فيها والقدرة على الاستمرار دون السماح ليوم واحد أن يتحول إلى انحراف كامل، يعد من الركائز الأساسية للحفاظ على التوازن الصحي.",
          ),
        },
        good: {
          en: "Good",
          ar: "جيد",
          min: 4,
          max: 5,
          recommendation: localized(
            "This level reflects a good capacity for commitment, but certain situations appear that may negatively affect the continuity of progress, such as diminishing enthusiasm over time or increased consumption of sweets beyond the norm. Focus should be placed on the underlying causes behind the decline rather than the decline itself; for example, if boredom is the trigger, diversifying the dietary pattern is more effective than tightening restrictions, whereas if the cause is hunger, priority must be given to satiety instead of excessively reducing quantities.",
            "يعكس هذا المستوى وجود قدرة جيدة على الالتزام، لكن تظهر بعض المواقف التي قد تؤثر سلباً على استمرارية التقدم، مثل تقلص الحماس مع مرور الوقت أو زيادة استهلاك الحلويات بشكل يفوق المعتاد. ينبغي التركيز على الأسباب الكامنة وراء التراجع بدلاً من التراجع ذاته، فمثلاً إذا كان الملل هو المحفز، فإن تنويع النمط الغذائي يكون أكثر فاعلية من تشديد القيود، أما إذا كان السبب الجوع، فيجب إعطاء الأولوية للشبع بدلاً من تقليل الكميات بشكل مفرط.",
          ),
        },
        average: {
          en: "Average",
          ar: "متوسط",
          min: 6,
          max: 7,
          recommendation: localized(
            "This level indicates a fragility in commitment, where you start with strong intentions but factors like a boring routine, dietary temptations like sweets, or the absence of quick results might push you back to old habits. It is recommended to set a sustainable plan that does not require excessive daily effort, and start with small, frequent adjustments that help with continuity without draining energy or willpower.",
            "يدل هذا المستوى على هشاشة الالتزام، حيث تبدأ بنية قوية ولكن العوامل مثل الروتين الممل، الإغراءات الغذائية كالحلويات، أو غياب النتائج السريعة، قد تدفعك للعودة إلى العادات القديمة. يُنصح بوضع خطة قابلة للاستمرار، بحيث لا تتطلب مجهوداً مفرطاً يومياً، والبدء بتعديلات صغيرة ومتكررة تساعد على الاستمرارية دون استنزاف الطاقة أو الإرادة.",
          ),
        },
        priority: {
          en: "Needs Attention",
          ar: "يحتاج لاهتمام",
          min: 8,
          max: 9,
          recommendation: localized(
            "At this level, the relationship with food requires urgent attention, as it may constitute a major obstacle to achieving your health goals, not due to weak character, but as a result of difficulties in continuity and commitment. It is recommended to focus on reducing points of friction; for example, if you stop after a few days, start with very small goals instead of comprehensive plans, as achieving repeated successes in simple goals enhances confidence and establishes a sustainable path toward progress.",
            "في هذا المستوى، تتطلب العلاقة مع الطعام اهتماماً عاجلاً، إذ قد تشكل عائقاً رئيسياً أمام تحقيق أهدافك الصحية، وليس بسبب ضعف شخصية، بل نتيجة صعوبات في الاستمرارية والالتزام. يُنصح بالتركيز على تقليل نقاط الاحتكاك، فمثلاً إذا كنت تتوقف بعد أيام قليلة، فابدأ بأهداف صغيرة جداً بدلاً من خطط شاملة، حيث أن تحقيق النجاحات المتكررة في أهداف بسيطة يعزز الثقة ويؤهس لمسار مستدام نحو التقدم.",
          ),
        },
      }),
    },
    {
      title: localized("Your Daily Eating Habits", "عاداتك الغذائية اليومية"),
      description: localized(
        "This section reads your food quality, home versus outside meals, and your protein and vegetable intake.",
        "يقرأ هذا القسم جودة طعامك واعتمادك على المنزل أو الخارج وحصتك من البروتين والخضار.",
      ),
      order: 6,
      questions: [
        {
          text: localized(
            "Where do you rely on most of your meals?",
            "أين تعتمد على معظم وجباتك",
          ),
          order: 1,
          choices: [
            {
              text: localized("Mostly homemade food", "طعام منزلي في الغالب"),
              score: 1,
            },
            {
              text: localized(
                "Mostly homemade with some meals outside",
                "منزلي غالبًا مع وجبات خارجية",
              ),
              score: 2,
            },
            {
              text: localized(
                "More outside than at home",
                "خارجي أكثر من المنزلي",
              ),
              score: 2,
            },
            {
              text: localized(
                "Outside or ready-made most of the time",
                "خارجي أو جاهز في معظم الوقت",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "Do your meals contain a clear source of protein?",
            "هل تحتوي وجباتك على مصدر بروتين واضح",
          ),
          order: 2,
          choices: [
            { text: localized("In most meals", "في معظم الوجبات"), score: 1 },
            {
              text: localized("In almost all meals", "في أغلب الوجبات تقريبًا"),
              score: 2,
            },
            {
              text: localized("In some meals only", "في بعض الوجبات فقط"),
              score: 2,
            },
            {
              text: localized(
                "I rarely pay attention to protein",
                "نادرًا ما أنتبه للبروتين",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "How many times do you eat vegetables daily?",
            "كم مرة تتناول الخضروات يوميًا",
          ),
          order: 3,
          choices: [
            { text: localized("With most meals", "مع معظم الوجبات"), score: 1 },
            {
              text: localized("Once or twice daily", "مرة إلى مرتين يوميًا"),
              score: 2,
            },
            {
              text: localized(
                "Several times a week only",
                "عدة مرات في الأسبوع فقط",
              ),
              score: 2,
            },
            {
              text: localized("I rarely eat them", "نادرًا ما أتناولها"),
              score: 3,
            },
          ],
        },
      ],
      resultRanges: sectionResultRanges({
        excellent: {
          en: "Excellent",
          ar: "ممتاز",
          min: 0,
          max: 3,
          recommendation: localized(
            "This level is characterized by a clear strength in control and commitment regarding your relationship with food, which makes executing any nutritional plan easier and more effective. It is recommended to utilize this strength in a realistic and balanced way; even if you tend to eat sweets, the awareness to control them and the ability to continue without allowing a single day to turn into a complete derailment is one of the fundamental pillars for maintaining healthy balance.",
            "يمتاز هذا المستوى بقوة واضحة في التحكم والالتزام بعلاقتك مع الطعام، مما يجعل تنفيذ أي خطة غذائية أكثر سهولة وفعالية. يُنصح بالاستفادة من هذه القوة بطريقة واقعية ومتزنة، فحتى إذا كنت تميل إلى تناول الحلويات، فإن الوعي بالتحكم فيها والقدرة على الاستمرار دون السماح ليوم واحد أن يتحول إلى انحراف كامل، يعد من الركائز الأساسية للحفاظ على التوازن الصحي.",
          ),
        },
        good: {
          en: "Good",
          ar: "جيد",
          min: 4,
          max: 5,
          recommendation: localized(
            "This level reflects a good capacity for commitment, but certain situations appear that may negatively affect the continuity of progress, such as diminishing enthusiasm over time or increased consumption of sweets beyond the norm. Focus should be placed on the underlying causes behind the decline rather than the decline itself; for example, if boredom is the trigger, diversifying the dietary pattern is more effective than tightening restrictions, whereas if the cause is hunger, priority must be given to satiety instead of excessively reducing quantities.",
            "يعكس هذا المستوى وجود قدرة جيدة على الالتزام، لكن تظهر بعض المواقف التي قد تؤثر سلباً على استمرارية التقدم، مثل تقلص الحماس مع مرور الوقت أو زيادة استهلاك الحلويات بشكل يفوق المعتاد. ينبغي التركيز على الأسباب الكامنة وراء التراجع بدلاً من التراجع ذاته، فمثلاً إذا كان الملل هو المحفز، فإن تنويع النمط الغذائي يكون أكثر فاعلية من تشديد القيود، أما إذا كان السبب الجوع، فيجب إعطاء الأولوية للشبع بدلاً من تقليل الكميات بشكل مفرط.",
          ),
        },
        average: {
          en: "Average",
          ar: "متوسط",
          min: 6,
          max: 7,
          recommendation: localized(
            "This level indicates a fragility in commitment, where you start with strong intentions but factors like a boring routine, dietary temptations like sweets, or the absence of quick results might push you back to old habits. It is recommended to set a sustainable plan that does not require excessive daily effort, and start with small, frequent adjustments that help with continuity without draining energy or willpower.",
            "يدل هذا المستوى على هشاشة الالتزام، حيث تبدأ بنية قوية ولكن العوامل مثل الروتين الممل، الإغراءات الغذائية كالحلويات، أو غياب النتائج السريعة، قد تدفعك للعودة إلى العادات القديمة. يُنصح بوضع خطة قابلة للاستمرار، بحيث لا تتطلب مجهوداً مفرطاً يومياً، والبدء بتعديلات صغيرة ومتكررة تساعد على الاستمرارية دون استنزاف الطاقة أو الإرادة.",
          ),
        },
        priority: {
          en: "Needs Attention",
          ar: "يحتاج لاهتمام",
          min: 8,
          max: 9,
          recommendation: localized(
            "At this level, the relationship with food requires urgent attention, as it may constitute a major obstacle to achieving your health goals, not due to weak character, but as a result of difficulties in continuity and commitment. It is recommended to focus on reducing points of friction; for example, if you stop after a few days, start with very small goals instead of comprehensive plans, as achieving repeated successes in simple goals enhances confidence and establishes a sustainable path toward progress.",
            "في هذا المستوى، تتطلب العلاقة مع الطعام اهتماماً عاجلاً، إذ قد تشكل عائقاً رئيسياً أمام تحقيق أهدافك الصحية، وليس بسبب ضعف شخصية، بل نتيجة صعوبات في الاستمرارية والالتزام. يُنصح بالتركيز على تقليل نقاط الاحتكاك، فمثلاً إذا كنت تتوقف بعد أيام قليلة، فابدأ بأهداف صغيرة جداً بدلاً من خطط شاملة، حيث أن تحقيق النجاحات المتكررة في أهداف بسيطة يعزز الثقة ويؤهس لمسار مستدام نحو التقدم.",
          ),
        },
      }),
    },
    {
      title: localized(
        "Digestion and Food Response",
        "الهضم واستجابة جسمك للأكل",
      ),
      description: localized(
        "This section reads your comfort after meals and foods that may cause you discomfort.",
        "يقرأ هذا القسم راحتك بعد الوجبات والأطعمة التي قد تسبب لك انزعاجًا.",
      ),
      order: 7,
      questions: [
        {
          text: localized(
            "How do you usually feel after eating meals?",
            "كيف تشعر بعد تناول وجباتك عادة",
          ),
          order: 1,
          choices: [
            {
              text: localized(
                "Comfortable and light most of the time",
                "راحة وخفة في معظم الأوقات",
              ),
              score: 1,
            },
            {
              text: localized(
                "Often comfortable with some heaviness",
                "راحة غالبًا مع ثقل أحيانًا",
              ),
              score: 2,
            },
            {
              text: localized(
                "Heavy or sluggish after many meals",
                "ثقل أو خمول بعد كثير من الوجبات",
              ),
              score: 2,
            },
            {
              text: localized(
                "Frequent discomfort after most meals",
                "انزعاج متكرر بعد معظم الوجبات",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "Do you feel bloated or gassy after eating?",
            "هل تشعر بانتفاخ أو غازات بعد الأكل",
          ),
          order: 2,
          choices: [
            { text: localized("Very rarely", "نادرًا جدًا"), score: 1 },
            {
              text: localized(
                "Sometimes with certain foods",
                "أحيانًا مع أطعمة معينة",
              ),
              score: 2,
            },
            {
              text: localized("Often during the week", "كثيرًا خلال الأسبوع"),
              score: 2,
            },
            { text: localized("Almost daily", "بشكل شبه يومي"), score: 3 },
          ],
        },
        {
          text: localized(
            "Are there foods that cause you digestive discomfort?",
            "هل توجد أطعمة تسبب لك إزعاجًا في الهضم",
          ),
          order: 3,
          choices: [
            {
              text: localized(
                "I do not notice bothersome foods",
                "لا ألاحظ أطعمة مزعجة",
              ),
              score: 1,
            },
            {
              text: localized(
                "One or two specific items only",
                "صنف أو صنفان محددان فقط",
              ),
              score: 2,
            },
            {
              text: localized("Several different items", "عدة أصناف متنوعة"),
              score: 2,
            },
            {
              text: localized(
                "Many items and I avoid eating them",
                "أصناف كثيرة وأتجنب الأكل أمامها",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "How would you describe your bowel regularity?",
            "كيف تصف انتظام عملية الإخراج لديك",
          ),
          order: 4,
          choices: [
            {
              text: localized("Regular and comfortable", "منتظمة ومريحة"),
              score: 1,
            },
            {
              text: localized(
                "Mostly regular with slight variation",
                "منتظمة غالبًا مع تفاوت بسيط",
              ),
              score: 2,
            },
            {
              text: localized("Often irregular", "غير منتظمة أحيانًا"),
              score: 2,
            },
            {
              text: localized(
                "Frequently irregular and bothersome",
                "غير منتظمة بشكل متكرر ومزعج",
              ),
              score: 3,
            },
          ],
        },
      ],
      resultRanges: sectionResultRanges({
        excellent: {
          en: "Excellent",
          ar: "ممتاز",
          min: 0,
          max: 4,
          recommendation: localized(
            "This level is characterized by largely comfortable digestion, as your body handles most meals without a clear feeling of heaviness or recurring discomfort. It is recommended to maintain the eating pattern that suits your body, as comfort after eating a meal is an important indicator that makes adhering to the dietary plan easier and reduces the need for random, unstudied changes in the diet.",
            "يتتميز هذا المستوى بهضم مريح إلى حد كبير، حيث يتعامل جسمك مع معظم الوجبات دون شعور بثقل واضح أو انزعاج متكرر. يُنصح بالحفاظ على نمط الأكل الذي يتناسب مع جسمك، إذ تُعد الراحة بعد تناول الوجبة مؤشراً مهماً يسهل الالتزام بالخطة الغذائية ويقلل من الحاجة إلى تغييرات عشوائية غير مدروسة في النظام الغذائي.",
          ),
        },
        good: {
          en: "Good",
          ar: "جيد",
          min: 5,
          max: 6,
          recommendation: localized(
            "This level reflects good digestive performance, with the presence of certain types of food or situations that may cause a feeling of heaviness or bloating. The problem is usually limited to specific foods and not the diet as a whole. It is essential to link the symptoms you feel to the quality of the meal; for example, if bloating appears after eating fatty foods or dairy products, careful observation is better than abruptly deleting large amounts of food.",
            "يعكس هذا المستوى أداء هضمياً جيداً، مع وجود بعض أنواع الأطعمة أو المواقف التي قد تسبب شعوراً بالثقل أو الانتفاخ. وغالباً ما تكون المشكلة محصورة في أطعمة معينة وليس في النظام الغذائي ككل. من الضروري ربط الأعراض التي تشعر بها بنوعية الوجبة، فمثلاً إذا ظهر الانتفاخ بعد تناول الأطعمة الدسمة أو مشتقات الألبان، فتكوان الملاحظة الدقيقة أفضل من حذف كميات كبيرة من الأطعمة بشكل مفاجئ.",
          ),
        },
        average: {
          en: "Average",
          ar: "متوسط",
          min: 7,
          max: 9,
          recommendation: localized(
            "This level indicates that digestion affects your comfort after meals, where you may feel heaviness, lethargy, or rapid hunger, which complicates the relationship between you and food. Focus should be placed on regulating eating speed, meal size, and its nutritional composition, as the same food has different effects depending on how it is consumed—whether quickly, in large quantities, or without getting enough protein.",
            "يشير هذا المستوى إلى أن الهضم يؤثر على راحتك بعد الوجبات، حيث قد تشعر بثقل، خمول أو جوع سريع، مما يعقد العلاقة بينك وبين الطعام. ينبغي التركيز على تنظيم سرعة تناول الطعام، حجم الوجبة، وتركيبها الغذائي، إذ أن لنفس الطعام تأثيرات مختلفة حسب طريقة تناوله، سواء بسرعة، بكميات كبيرة، أو دون الحصول على كميات كافية من البروتين.",
          ),
        },
        priority: {
          en: "Needs Attention",
          ar: "يحتاج لاهتمام",
          min: 10,
          max: 12,
          recommendation: localized(
            "At this level, digestion requires special attention, as recurring discomfort after eating food might push you to avoid important foods or resort to eating in a random and disorganized manner. It is recommended to document the quality of food and the sensations accompanying it over several days, aiming to identify the true triggers for these discomforts instead of random experimentation. If symptoms are severe or persistent, it is best to consult a health professional to evaluate the condition accurately.",
            "في هذا المستوى، يتطلب الهضم اهتماماً خاصاً، إذ أن تكرار الانزعاج بعد تناول الطعام قد يدفعك لتجنب أطعمة مهمة أو اللجوء إلى تناول الطعام بشكل عشوائي وغير منظم. يُنصح بتوثيق نوعية الطعام والأحاسيس المصاحبة له على مدار عدة أيام، بهدف التعرف على المحفزات الحقيقية لهذه الانزعاجات بدلاً من التجربة العشوائية. وإذا كانت الأعراض شديدة أو مستمرة، فمن الأفضل استشارة مختص صحي لتقييم الحالة بدقة.",
          ),
        },
      }),
    },
    {
      title: localized(
        "Psychological State and Emotional Eating",
        "الحالة النفسية والأكل العاطفي",
      ),
      description: localized(
        "This section reads how your emotional state affects your eating and your behavior after overeating.",
        "يقرأ هذا القسم تأثير حالتك النفسية على أكلك وتصرفك بعد تناول كمية زائدة.",
      ),
      order: 8,
      questions: [
        {
          text: localized(
            "Does your psychological state affect how much or what you eat?",
            "هل تؤثر حالتك النفسية على كمية أو نوع أكلك",
          ),
          order: 1,
          choices: [
            {
              text: localized(
                "Rarely; my eating decisions are independent from mood",
                "نادرًا، قراراتي في الأكل مستقلة عن مزاجي",
              ),
              score: 1,
            },
            {
              text: localized(
                "Sometimes on stressful days",
                "أحيانًا في أيام الضغط",
              ),
              score: 2,
            },
            {
              text: localized(
                "Often, mood guides my eating",
                "كثيرًا، المزاج يوجه أكلي غالبًا",
              ),
              score: 2,
            },
            {
              text: localized(
                "Almost always, eating is the first reaction to my feelings",
                "دائمًا تقريبًا، الأكل أول رد فعل لمشاعري",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "When stressed or sad, what usually happens?",
            "عند التوتر أو الحزن ما الذي يحدث عادة",
          ),
          order: 2,
          choices: [
            {
              text: localized(
                "My eating does not change much",
                "لا يتغير أكلي كثيرًا",
              ),
              score: 1,
            },
            {
              text: localized(
                "I eat a little more then return to normal",
                "أزيد قليلًا ثم أعود لطبيعتي",
              ),
              score: 2,
            },
            {
              text: localized(
                "I turn to food to ease stress clearly",
                "ألجأ للأكل لتخفيف التوتر بوضوح",
              ),
              score: 2,
            },
            {
              text: localized(
                "I lose control of the amount in these times",
                "أفقد السيطرة على الكمية في هذه الأوقات",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "How do you feel after eating more than usual?",
            "كيف تشعر بعد تناول كمية أكبر من المعتاد",
          ),
          order: 3,
          choices: [
            {
              text: localized(
                "I accept it and calmly return to my path",
                "أتقبل الأمر وأعود لمساري بهدوء",
              ),
              score: 1,
            },
            {
              text: localized(
                "I feel slight discomfort that passes quickly",
                "أشعر بانزعاج بسيط يزول سريعًا",
              ),
              score: 2,
            },
            {
              text: localized(
                "I feel guilt that affects the rest of my day",
                "أشعر بذنب يؤثر على باقي يومي",
              ),
              score: 2,
            },
            {
              text: localized(
                "I blame myself severely and may leave the plan",
                "ألوم نفسي بشدة وقد أترك النظام",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "Do you eat to soothe emotions rather than hunger?",
            "هل تأكل لتهدئة مشاعرك بدلًا من الجوع",
          ),
          order: 4,
          choices: [
            { text: localized("Very rarely", "نادرًا جدًا"), score: 1 },
            { text: localized("Sometimes", "أحيانًا"), score: 2 },
            { text: localized("Often", "كثيرًا"), score: 2 },
            { text: localized("Most of the time", "معظم الوقت"), score: 3 },
          ],
        },
      ],
      resultRanges: sectionResultRanges({
        excellent: {
          en: "Excellent",
          ar: "ممتاز",
          min: 0,
          max: 4,
          recommendation: localized(
            "This level is characterized by a balanced relationship between mood and eating habits, where emotions do not completely control food decisions, making the control and mastery of the dietary system easier. It is recommended to maintain this clear separation; if you go through a day full of psychological stress and consume larger amounts of food, the most important thing is to return to your normal path without continuous self-blame that might negatively affect the continuity of your commitment during the week.",
            "يتسم هذا المستوى بعلاقة متوازنة بين المزاج وعادات الأكل، حيث لا تسيطر المشاعر بشكل كامل على قرارات تناول الطعام، مما يسهل عملية التحكم والسيطرة على النظام الغذائي. يُنصح بالمحافظة على هذا الفصل الواضح، فإذا مررت بيوم مليء بالضغط النفسي وتناولت كميات أكبر من الطعام، فالأهم أن تعود إلى مسارك الطبيعي دون لوم ذاتي مستمر قد يؤثر سلباً على استمرارية التزامك خلال الأسبوع.",
          ),
        },
        good: {
          en: "Good",
          ar: "جيد",
          min: 5,
          max: 6,
          recommendation: localized(
            "This level reflects an influence of stress or sadness on eating habits on some days, which is common and does not mean a loss of control. It is important to pay attention to the moment preceding eating; for example, if you tend to eat after work stress, ask yourself if you genuinely need food or just a short break, as such a question might change your decision and reduce emotional eating.",
            "يعكس هذا المستوى وجود تأثير للتوتر أو الحزن على عادات الأكل في بعض الأيام، وهو أمر شائع لا يعني فقدان السيطرة. من المهم الانتباه للحظة التي تسبق تناول الطعام، فمثلاً إذا كنت تميل لتناول الطعام بعد ضغوط العمل، اسأل نفسك إذا ما كنت بحاجة حقيقية للطعام أم لاستراحة قصيرة، فمثل هذا التساؤل قد يغير قرارك ويقلل من تناول الطعام العاطفي.",
          ),
        },
        average: {
          en: "Average",
          ar: "متوسط",
          min: 7,
          max: 9,
          recommendation: localized(
            "This level indicates that mood plays a prominent role in eating behaviors, where food may be used as a quick way to relieve stress, followed by feelings of discomfort or guilt. Focus should be placed on finding realistic alternatives before resorting to eating; the body and mind need other soothing means such as a short walk or making a phone call, which might redirect your day positively without resorting to food consumption.",
            "يشير هذا المستوى إلى أن المزاج يلعب دوراً بارزاً في سلوكيات الأكل، حيث قد يُستخدم الطعام كوسيلة سريعة لتخفيف التوتر، تليها مشاعر انزعاج أو ذنب. ينبغي التركيز على إيجاد بدائل واقعية قبل اللجوء إلى الأكل، فالجسم والنفس بحاجة إلى وسائل تهدئة أخرى مثل المشي القصير أو إجراء مكالمة هاتفية، والتي قد تعيد توجيه يومك بشكل إيجابي دون اللجوء لتناول الطعام.",
          ),
        },
        priority: {
          en: "Needs Attention",
          ar: "يحتاج لاهتمام",
          min: 10,
          max: 12,
          recommendation: localized(
            "At this level, the relationship between emotions and eating constitutes a challenge that demands urgent attention, as food becomes a direct reaction to stress or sadness, making it difficult to control the quantities consumed. It is necessary to focus on identifying the triggers that start this cycle, without burdening yourself with blame, and work on understanding the emotions that drive the desire to eat and address them before they turn into unconscious dietary choices.",
            "في هذا المستوى، تشكل العلاقة بين المشاعر وتناول الطعام تحدياً يستدعي اهتماماً عاجلاً، حيث يصبح الطعام رد فعل مباشر للتوتر أو الحزن، مما يصعب التحكم في الكميات المستهلكة. من الضروري التركيز على التعرف على المحفزات التي تبدأ هذه الدائرة، دون تحميل النفس اللوم، والعمل على فهم المشاعر التي تحرك الرغبة في الأكل ومعالجتها قبل أن تتحول إلى اختيارات غذائية غير واعية.",
          ),
        },
      }),
    },
    {
      title: localized(
        "Meal Organization and Fullness",
        "تنظيم الوجبات والشبع",
      ),
      description: localized(
        "This section reads your meal times, breakfast, number of meals, and satiety.",
        "يقرأ هذا القسم مواعيد وجباتك ووجبة الإفطار وعددها ومدى شعورك بالشبع.",
      ),
      order: 9,
      questions: [
        {
          text: localized(
            "Do you have roughly fixed meal times?",
            "هل لديك مواعيد ثابتة تقريبًا لوجباتك",
          ),
          order: 1,
          choices: [
            {
              text: localized(
                "Yes, regular times most days",
                "نعم، مواعيد منتظمة معظم الأيام",
              ),
              score: 1,
            },
            {
              text: localized(
                "Mostly regular with some variation",
                "منتظمة غالبًا مع بعض التغير",
              ),
              score: 2,
            },
            {
              text: localized("Often irregular", "غير منتظمة كثيرًا"),
              score: 2,
            },
            {
              text: localized("Completely random", "عشوائية تمامًا"),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "Do you usually eat breakfast?",
            "هل تتناول وجبة الإفطار عادة",
          ),
          order: 2,
          choices: [
            { text: localized("Almost daily", "يوميًا تقريبًا"), score: 1 },
            { text: localized("Most days", "في معظم الأيام"), score: 2 },
            { text: localized("Only sometimes", "أحيانًا فقط"), score: 2 },
            {
              text: localized(
                "Rarely or always skip it",
                "نادرًا أو أتخطاها دائمًا",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "How many main meals do you have per day?",
            "كم عدد وجباتك الرئيسية في اليوم",
          ),
          order: 3,
          choices: [
            {
              text: localized("Three regular meals", "ثلاث وجبات منتظمة"),
              score: 1,
            },
            {
              text: localized(
                "Two meals with acceptable organization",
                "وجبتان مع تنظيم مقبول",
              ),
              score: 2,
            },
            {
              text: localized(
                "Usually one large meal",
                "وجبة واحدة كبيرة غالبًا",
              ),
              score: 2,
            },
            {
              text: localized(
                "Not defined and varies daily",
                "غير محدد ويختلف من يوم لآخر",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "Do you feel full after your meals?",
            "هل تشعر بالشبع بعد وجباتك",
          ),
          order: 4,
          choices: [
            {
              text: localized(
                "I feel comfortably full most meals",
                "أشعر بشبع مريح في معظم الوجبات",
              ),
              score: 1,
            },
            {
              text: localized(
                "Acceptable fullness with quick hunger",
                "شبع مقبول مع جوع سريع",
              ),
              score: 2,
            },
            {
              text: localized(
                "I remain hungry after many meals",
                "أظل جائعًا بعد كثير من الوجبات",
              ),
              score: 2,
            },
            {
              text: localized(
                "I often do not reach fullness",
                "لا أصل إلى الشعور بالشبع غالبًا",
              ),
              score: 3,
            },
          ],
        },
      ],
      resultRanges: sectionResultRanges({
        excellent: {
          en: "Excellent",
          ar: "ممتاز",
          min: 0,
          max: 4,
          recommendation: localized(
            "This level is characterized by very good organization in meal timings, providing your body with a clear routine that helps achieve a better sense of satiety and make calmer, more deliberate nutritional decisions. It is recommended to continue stabilizing this effective routine; having breakfast or regular meals reduces the appearance of sudden hunger and limits making random food choices during late hours of the day.",
            "يتسم هذا المستوى بتنظيم جيد جداً في مواعيد تناول الوجبات، حيث يتمتع جسمك بروتين واضح يساعد على تحقيق شعور أفضل بالشبع واتخاذ قرارات غذائية أكثر هدوءاً وتأنياً. يُنصح بالاستمرار في تثبيت هذا الروتين الفعال، فوجود وجبة فطور أو وجبات منتظمة يقلل من ظهور الجوع المفاجئ ويحد من اتخاذ قرارات عشوائية في تناول الطعام خلال أوقات متأخرة من اليوم.",
          ),
        },
        good: {
          en: "Good",
          ar: "جيد",
          min: 5,
          max: 6,
          recommendation: localized(
            "This level shows acceptable regularity in meal organization, with some details requiring finer adjustment in food timing or satiety levels. Skipping some meals or needing larger quantities at certain times may occur occasionally. It is recommended to focus on meals that precede rapid increases in appetite, as they often need their protein or fiber content enhanced to support the feeling of fullness for longer periods.",
            "يظهر هذا المستوى انتظاماً مقبولاً في تنظيم الوجبات، مع وجود بعض التفاصيل التي تتطلب ضبطاً أدق في توقيت تناول الطعام أو مستوى الشبع. قد يحدث أحياناً تفويت لبعض الوجبات أو الحاجة إلى كميات أكبر في أوقات معينة. يُنصح بالتركيز على الوجبات التي تسبق زيادة الشهية السريعة، حيث غالباً ما تحتاج إلى تعزيز محتواها من البروتين أو الألياف لتدعيم الشعور بالشبع لفترات أطول.",
          ),
        },
        average: {
          en: "Average",
          ar: "متوسط",
          min: 7,
          max: 9,
          recommendation: localized(
            "This level indicates insufficient stability in meal timings or the number of meals, which can lead to a strong feeling of hunger or an increase in quantities consumed at late hours. It is important to arrange your day's schedule before focusing on food types; your body needs to know specific eating times, and when these times improve, the feeling of fullness improves and quantities consumed adjust automatically.",
            "يشير هذا المستوى إلى عدم ثبات كافٍ في مواعيد تناول الطعام أو عدد الوجبات، مما قد يؤدي إلى ظهور شعور بالجوع بشكل قوي أو زيادة في الكميات المتناولة في أوقات متأخرة. من المهم ترتيب جدول اليوم قبل التركيز على نوع الطعام، إذ يحتاج جسمك إلى معرفة مواعيد الأكل المحددة، وعند تحسين هذه المواعيد يتحسن الشعور بالشبع وتضبط الكميات المتناولة تلقائياً.",
          ),
        },
        priority: {
          en: "Needs Attention",
          ar: "يحتاج لاهتمام",
          min: 10,
          max: 12,
          recommendation: localized(
            "At this level, meal organization requires clear and urgent intervention, as skipping meals or eating randomly can push the body to demand larger quantities at difficult times. It is recommended to focus on stabilizing the first two meals of the day, without needing them to be perfect; the important thing is that they are at specific and clear times, helping to reduce intense hunger and the urgent craving to eat quickly.",
            "في هذا المستوى، يتطلب تنظيم الوجبات تدخلاً واضحاً وعاجلاً، حيث أن تفويت الوجبات أو تناول الطعام بشكل عشوائي قد يدفع الجسم للمطالبة بكميات أكبر في أوقات صعبة. يُنصح بالتركيز على تثبيت أول وجبتين في اليوم، دون الحاجة إلى أن تكونا مثاليتين، المهم أن تكونا في أوقات محددة وواضحة، مما يساعد على تقليل الشعور بالجوع الشديد والرغبة الملحة في تناول الطعام بسرعة.",
          ),
        },
      }),
    },
    {
      title: localized(
        "Cravings for Sweets and Snacks",
        "الرغبة في السكريات والسناك",
      ),
      description: localized(
        "This section reads how often you crave sweets, when desires increase, and your ability to stop.",
        "يقرأ هذا القسم تكرار رغبتك في السكريات وتوقيتها وقدرتك على التوقف.",
      ),
      order: 10,
      questions: [
        {
          text: localized(
            "How often do you feel a strong desire for sweets?",
            "كم مرة تشعر برغبة قوية في السكريات",
          ),
          order: 1,
          choices: [
            {
              text: localized(
                "Rarely and easy to control",
                "نادرًا ورغبة يسهل التحكم",
              ),
              score: 1,
            },
            {
              text: localized("Several times a week", "عدة مرات في الأسبوع"),
              score: 2,
            },
            { text: localized("Almost daily", "يوميًا تقريبًا"), score: 2 },
            {
              text: localized(
                "Several times a day and hard to stop",
                "عدة مرات في اليوم ويصعب",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "When does your desire for sweets usually increase?",
            "متى تزيد رغبتك في السكريات عادة",
          ),
          order: 2,
          choices: [
            {
              text: localized(
                "No fixed times and it stays limited",
                "لا توجد أوقات ثابتة وتبقى محدودة",
              ),
              score: 1,
            },
            {
              text: localized("When tired or hungry", "عند التعب أو الجوع"),
              score: 2,
            },
            {
              text: localized("Often in the evening", "في المساء بشكل متكرر"),
              score: 2,
            },
            {
              text: localized(
                "Throughout the day irregularly",
                "على مدار اليوم بشكل غير منتظم",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "Can you stop after eating a small amount of sweets?",
            "هل تستطيع التوقف بعد تناول كمية صغيرة من الحلويات",
          ),
          order: 3,
          choices: [
            {
              text: localized("Yes, I stop easily", "نعم، أتوقف بسهولة"),
              score: 1,
            },
            {
              text: localized(
                "Usually with some difficulty",
                "غالبًا مع بعض الصعوبة",
              ),
              score: 2,
            },
            {
              text: localized(
                "I find it clearly hard to stop",
                "أجد صعوبة واضحة في التوقف",
              ),
              score: 2,
            },
            {
              text: localized(
                "It's difficult to stop once I start",
                "يصعب علي التوقف بعد البدء",
              ),
              score: 3,
            },
          ],
        },
      ],
      resultRanges: sectionResultRanges({
        excellent: {
          en: "Excellent",
          ar: "ممتاز",
          min: 0,
          max: 3,
          recommendation: localized(
            "This level features very good control over sugar cravings; the desire exists naturally but does not completely control your daily trends. It is recommended to focus on maintaining fullness and organizing meal timings, as controlling sugar consumption becomes easier when the body avoids long periods of hunger or a lack of sleep.",
            "يتميز هذا المستوى بسيطرة جيدة جداً على الرغبة في تناول السكريات، حيث تكون الرغبة موجودة بشكل طبيعي ولكنها لا تتحكم في توجهاتك اليومية بشكل كامل. يُنصح بالتركيز على الحفاظ على الشعور بالشبع وتنظيم مواعيد الوجبات، إذ يصبح التحكم في استهلاك السكريات أكثر سهولة عندما يتجنب الجسم فترات الجوع الطويلة أو نقص النوم.",
          ),
        },
        good: {
          en: "Good",
          ar: "جيد",
          min: 4,
          max: 5,
          recommendation: localized(
            "This level reflects a good capacity for control, with specific times when sugar cravings increase, often linked to fatigue or feeling hungry. It is important to review meal timings and sleep quality in these cases, rather than considering sweets as the sole problem, since nutritional balance and good sleep play a fundamental role in reducing this desire.",
            "يعكس هذا المستوى قدرة جيدة على التحكم، مع وجود أوقات محددة تزيد فيها الرغبة في السكريات، غالباً ما تكون مرتبطة بالتعب أو الشعور بالجوع. من المهم مراجعة توقيت تناول الوجبات وجودة النوم في هذه الحالات، بدلاً من اعتبار الحلويات هي المشكلة الوحيدة، إذ أن التوازن الغذائي والنوم الجيد يلعبان دوراً أساسياً في تقليل هذه الرغبة.",
          ),
        },
        average: {
          en: "Average",
          ar: "متوسط",
          min: 6,
          max: 7,
          recommendation: localized(
            "This level indicates that sweets and snacking consumption might hinder part of the progress toward your goals, often due to frequent intake and an inability to stop after starting. It is recommended to focus on reducing random snacking by determining the portion size beforehand and eating them in bowls/plates instead of directly from the package; such a simple change can reduce the quantities consumed without a major psychological struggle.",
            "يشير هذا المستوى إلى أن تناول السكريات والوجبات الخفيفة قد يعيق جزءاً من التقدم نحو أهدافك، وغالباً ما يكون السبب تكرار الاستهلاك وعدم القدرة على التوقف بعد البدء. يُنصح بالتركيز على تقليل الاستهلاك العشوائي للوجبات الخفيفة، من خلال تحديد الكمية مسبقاً وتناولها في أطباق بدلاً من تناولها مباشرة من العبوة، فمثل هذا التغيير البسيط يمكن أن يقلل الكميات المستهلكة دون صراع نفسي كبير.",
          ),
        },
        priority: {
          en: "Needs Attention",
          ar: "يحتاج لاهتمام",
          min: 8,
          max: 9,
          recommendation: localized(
            "At this level, frequent sugar cravings demand special attention, as they may lead to unconscious increases in calorie consumption. Focus should be placed on addressing the root causes behind this desire, such as prolonged hunger, lack of sleep, and psychological stress, as improving the quality of a single main meal can be more effective in reducing snacking than relying solely on willpower.",
            "في هذا المستوى، تستدعي الرغبة المتكررة في السكريات اهتماماً خاصاً، إذ قد تؤدي إلى زيادة الاستهلاك غير الواعي للسعرات الحرارية. ينبغي التركيز على معالجة الأسباب الكامنة وراء هذه الرغبة، مثل الجوع الطويل، نقص النوم، والضغوط النفسية، إذ أن تحسين جودة وجبة رئيسية واحدة قد يكون أكثر فعالية في تقليل تناول الوجبات الخفيفة من الاعتماد فقط على قوة الإرادة.",
          ),
        },
      }),
    },
    {
      title: localized(
        "Readiness for Change and Continuity",
        "الاستعداد للتغيير والاستمرار",
      ),
      description: localized(
        "This section reads how ready you are to change, your main barrier, and what you need to continue.",
        "يقرأ هذا القسم جاهزيتك للتغيير وأكبر عائق أمامك وما تحتاجه للاستمرار.",
      ),
      order: 11,
      questions: [
        {
          text: localized(
            "How ready are you to start a new plan now?",
            "ما مدى استعدادك للبدء في خطة جديدة الآن",
          ),
          order: 1,
          choices: [
            {
              text: localized(
                "Fully ready and committed",
                "مستعد تمامًا وجاهز للالتزام",
              ),
              score: 1,
            },
            {
              text: localized(
                "Ready but need a suitable plan",
                "مستعد لكني أحتاج خطة مناسبة لظروفي",
              ),
              score: 2,
            },
            {
              text: localized(
                "I want to but my execution falters quickly",
                "لدي رغبة لكن تنفيذي يتعثر بسرعة",
              ),
              score: 2,
            },
            {
              text: localized(
                "I find it difficult to be ready or continue",
                "أجد صعوبة في الاستعداد أو الاستمرار",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "What is the biggest barrier to your persistence usually?",
            "ما العائق الأكبر أمام استمرارك عادة",
          ),
          order: 2,
          choices: [
            {
              text: localized(
                "There is usually no major barrier",
                "لا يوجد عائق كبير غالبًا",
              ),
              score: 1,
            },
            {
              text: localized(
                "Boredom or need for variety",
                "الملل أو الحاجة إلى التنويع",
              ),
              score: 2,
            },
            {
              text: localized(
                "Lack of time or life pressure",
                "ضيق الوقت أو ضغط الحياة",
              ),
              score: 2,
            },
            {
              text: localized(
                "Multiple recurring barriers",
                "عوائق متعددة تتكرر باستمرار",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "What do you need most to continue?",
            "ما الذي تحتاجه أكثر لتستمر",
          ),
          order: 3,
          choices: [
            {
              text: localized(
                "I can continue well on my own",
                "أستمر بشكل جيد بمفردي",
              ),
              score: 1,
            },
            {
              text: localized(
                "Simple follow-up and clear steps",
                "متابعة بسيطة ووضوح في الخطوات",
              ),
              score: 2,
            },
            {
              text: localized(
                "Continuous follow-up and constant reminders",
                "متابعة مستمرة وتذكير دائم",
              ),
              score: 2,
            },
            {
              text: localized(
                "Strong support and close follow-up to continue",
                "دعم كبير ومتابعة لصيقة لأستمر",
              ),
              score: 3,
            },
          ],
        },
      ],
      resultRanges: sectionResultRanges({
        excellent: {
          en: "Excellent",
          ar: "ممتاز",
          min: 0,
          max: 3,
          recommendation: localized(
            "This level is characterized by high readiness to begin and continue applying appropriate plans for your life and goals. You possess the ability to commit as long as the plan is suitable and your circumstances are fitting. It is recommended to utilize this readiness carefully and not rush progress; enthusiasm is important but it needs simple and clear steps to avoid turning into psychological stress over time.",
            "يتسم هذا المستوى باستعداد عالٍ للبدء والاستمرار في تطبيق الخطط المناسبة لحياتك وأهدافك. تمتلك القدرة على الالتزام طالما أن الخطة ملائمة وظروفك مناسبة. يُنصح بالاستفادة من هذه الجاهزية بحذر وعدم استعجال التقدم، فالحماس مهم لكنه يحتاج إلى خطوات بسيطة وواضحة لتجنب تحوله إلى ضغط نفسي مع مرور الأيام.",
          ),
        },
        good: {
          en: "Good",
          ar: "جيد",
          min: 4,
          max: 5,
          recommendation: localized(
            "This level reflects a good capacity for continuity, with a notable need for designing an appropriate plan that supports your follow-up and clarity of goals. You might be ready to commit, but you need continuous tracking, diversification in methods, or greater clarity in steps. It is recommended to focus on factors that enhance continuity; if follow-up is important to you, do not rely on yourself alone, and if boredom is an obstacle, variety in the diet or activity is an essential part of the solution.",
            "يعكس هذا المستوى قدرة جيدة على الاستمرارية، مع حاجة ملحوظة لتصميم خطة ملائمة تدعم متابعتك ووضوح أهدافك. قد تكون مستعداً للالتزام، لكنك تحتاج إلى متابعة مستمرة، تنويع في الأساليب، أو وضوح أكبر في الخطوات. يُنصح بالتركيز على العوامل التي تعزز الاستمرارية، فإذا كانت المتابعة مهمة بالنسبة لك فلا تعتمد على الذات فقط، وإذا كان الملل عائقاً، فالتنوع في النظام الغذائي أو النشاط يُعد جزءاً أساسياً من الحل.",
          ),
        },
        average: {
          en: "Average",
          ar: "متوسط",
          min: 6,
          max: 7,
          recommendation: localized(
            "This level indicates a clear desire to achieve results, but execution may falter quickly due to known obstacles that need practical strategies to overcome. It is important to simplify the starting phase; if time is an obstacle, easy-to-prepare meals can be chosen, and if hunger represents a problem, it is best to focus on achieving satiety. Every obstacle requires a different approach to deal with effectively.",
            "يشير هذا المستوى إلى وجود رغبة واضحة في تحقيق النتائج، لكن التنفيذ قد يتعثر بسرعة نتيجة معوقات معروفة تحتاج إلى استراتيجيات عملية للتغلب عليها. من المهم تبسيط مرحلة البداية، فإذا كان الوقت عائقاً، فيمكن اختيار وجبات سهلة التحضير، وإذا كان الجوع يمثل مشكلة، فالأفضل التركيز على تحقيق الشبع. كل عائق يتطلب مدخلاً مختلفاً للتعامل الفعال.",
          ),
        },
        priority: {
          en: "Needs Attention",
          ar: "يحتاج لاهتمام",
          min: 8,
          max: 9,
          recommendation: localized(
            "At this level, continuous commitment requires major attention; the desire to achieve results may be present, but traditional plans might clash with your daily life circumstances or psychological state. It is recommended to focus on very small goals that can be achieved even on the worst days, as the frequent repetition of small successes builds confidence gradually. Continuity starts with easy, doable steps, not with ideal plans that may seem complex or exhausting.",
            "في هذا المستوى، يتطلب استمرار الالتزام اهتماماً كبيراً، حيث قد تتوفر الرغبة في تحقيق النتائج، لكن الخطط التقليدية قد تتصادم مع ظروف حياتك اليومية أو حالتك النفسية. يُنصح بالتركيز على أهداف صغيرة جداً يمكن تحقيقها حتى في أسوأ الأيام، فالتكرار المتكرر للنجاحات الصغيرة يبني الثقة تدريجياً. يبدأ الاستمرار بخطوات يسيرة قابلة للتنفيذ، وليس بخطط مثالية قد تبدو معقدة أو مرهقة.",
          ),
        },
      }),
    },
    {
      title: localized("Female Only Section", "قسم خاص بالإناث"),
      description: localized(
        "This section reads how your menstrual cycle affects hunger, weight, and cravings.",
        "يقرأ هذا القسم تأثير الدورة الشهرية على الشهية والوزن والرغبة في السكريات.",
      ),
      order: 12,
      visibilityCondition: {
        rules: [
          {
            field: "profile.gender",
            operator: "equals",
            value: "female",
          },
        ],
        logic: "AND",
      },
      questions: [
        {
          text: localized(
            "Does your menstrual cycle affect your appetite or craving for sweets?",
            "هل تؤثر الدورة الشهرية على شهيتك أو رغبتك في الحلويات",
          ),
          order: 1,
          choices: [
            {
              text: localized(
                "A limited effect that is easy to manage",
                "تأثير محدود يسهل التعامل معه",
              ),
              score: 1,
            },
            {
              text: localized(
                "A slight noticeable effect before the period",
                "تأثير بسيط ملحوظ قبل الدورة",
              ),
              score: 2,
            },
            {
              text: localized(
                "A clear effect on appetite and sweets",
                "تأثير واضح على الشهية والحلويات",
              ),
              score: 2,
            },
            {
              text: localized(
                "A strong repeated effect that is hard to control",
                "تأثير قوي ومتكرر يصعب ضبطه",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "Do you notice weight changes or fluid retention near your period?",
            "هل تلاحظين تغيرًا في الوزن أو احتباس السوائل قرب الدورة",
          ),
          order: 2,
          choices: [
            {
              text: localized(
                "A slight change that returns quickly",
                "تغير بسيط يعود لطبيعته سريعًا",
              ),
              score: 1,
            },
            {
              text: localized(
                "A noticeable but temporary change",
                "تغير ملحوظ لكنه مؤقت",
              ),
              score: 2,
            },
            {
              text: localized(
                "A clear change that affects my mood",
                "تغير واضح يؤثر على معنوياتي",
              ),
              score: 2,
            },
            {
              text: localized(
                "A large repeated change that worries me",
                "تغير كبير ومتكرر يقلقني",
              ),
              score: 3,
            },
          ],
        },
      ],
      resultRanges: sectionResultRanges({
        excellent: {
          en: "Excellent",
          ar: "ممتاز",
          min: 0,
          max: 2,
          recommendation: localized(
            "This level indicates that monthly changes have a limited impact or can be easily controlled, allowing you to read body weight and appetite levels in a calmer, more objective manner. It is recommended to focus on monitoring the days preceding the menstrual cycle without making quick judgments on physical changes, as slight variations in appetite or weight might be temporary and return to normal within a few days.",
            "يدل هذا المستوى على أن التغيرات الشهرية تؤثر بشكل محدود أو يمكن التحكم بها بسهولة، مما يتيح لك قراءة وزن الجسم ومستوى الشهية بصورة أكثر هدوءاً وموضوعية. يُنصح بالتركيز على مراقبة الأيام التي تسبق الدورة الشهرية دون إطلاق أحكام سريعة على التغيرات البدنية، إذ قد يكون التغير الطفيف في الشهية أو الوزن مؤقتاً ويعود إلى طبيعته خلال أيام قليلة.",
          ),
        },
        good: {
          en: "Good",
          ar: "جيد",
          min: 3,
          max: 4,
          recommendation: localized(
            "This level reflects a noticeable slight effect before the start of the cycle, which may manifest as an increase in appetite or temporary fluid retention. It is essential to understand the timing of these changes; if the same symptoms recur monthly, dealing with them requires simple preparation and awareness without self-blame or making drastic changes to the dietary plan or lifestyle.",
            "يعكس هذا المستوى وجود تأثير طفيف ملحوظ قبل بداية الدورة، قد يظهر في زيادة الشهية أو احتباس السوائل بشكل مؤقت. من الضروري فهم توقيت هذه التغيرات، فإذا تكررت نفس الأعراض شهرياً، فإن التعامل معها يتطلب استعداداً بسيطاً ووعياً دون لوم الذات أو إحداث تغييرات جذرية في الخطة الغذائية أو نمط الحياة.",
          ),
        },
        average: {
          en: "Average",
          ar: "متوسط",
          min: 5,
          max: 5,
          recommendation: localized(
            "This level indicates a clear impact of the pre-cycle period on appetite, the desire to eat sweets, or a perceived change in weight. It is recommended to include this phase within the nutrition management plan, with a focus on meeting the body's needs through satiating meals, improving sleep quality, and reducing random food-related decisions during this period.",
            "يشير هذا المستوى إلى تأثير واضح للفترة التي تسبق الدورة على الشهية، الرغبة في تناول الحلويات، أو الإحساس بتغير في الوزن. يُنصح بإدراج هذه المرحلة ضمن خطة إدارة التغذية، مع التركيز على تلبية احتياجات الجسم من الوجبات المشبعة، تحسين جودة النوم، وتقليل القرارات العشوائية المتعلقة بتناول الطعام خلال هذه الفترة.",
          ),
        },
        priority: {
          en: "Needs Attention",
          ar: "يحتاج لاهتمام",
          min: 6,
          max: 6,
          recommendation: localized(
            "At this level, monthly changes require special attention, as they may frequently affect eating behaviors and weight fluctuations. It is important to avoid evaluating your progress based solely on these days, and if the appetite is excessively high or symptoms are strong and persistent, it is preferable to consult a health professional to evaluate the condition and set an appropriate plan to handle it effectively.",
            "في هذا المستوى، تتطلب التغيرات الشهرية اهتماماً خاصاً، إذ قد تؤثر بشكل متكرر على سلوكيات الأكل وتغيرات الوزن. من المهم تجنب تقييم تقدمك فقط بناءً على هذه الأيام، وفي حال كانت الشهية مرتفعة بشكل مفرط أو الأعراض قوية ومستمرة، يُفضل استشارة مختص صحي لتقييم الحالة ووضع خطة مناسبة للتعامل معها بفعالية.",
          ),
        },
      }),
    },
    {
      title: localized("Motivation and Body Image", "الدافع وصورة الجسم"),
      description: localized(
        "This section reads your relationship with your body image and what you want to understand from your report.",
        "يقرأ هذا القسم علاقتك بشكل جسمك وما تود فهمه من تقريرك.",
      ),
      order: 13,
      questions: [
        {
          text: localized(
            "How would you describe your current relationship with your body image?",
            "كيف تصف علاقتك بشكل جسمك حاليًا",
          ),
          order: 1,
          choices: [
            {
              text: localized(
                "Generally satisfied with a calm desire to improve",
                "راضٍ بشكل عام مع رغبة هادئة في التحسين",
              ),
              score: 1,
            },
            {
              text: localized(
                "I have some dissatisfaction and questions I want answered",
                "لدي بعض عدم الرضا وأسئلة أريد إجابتها",
              ),
              score: 2,
            },
            {
              text: localized(
                "I am dissatisfied and it affects my decisions",
                "عدم الرضا يؤثر على قراراتي",
              ),
              score: 2,
            },
            {
              text: localized(
                "My body shape clearly affects my self-confidence",
                "شكل جسمي يؤثر على ثقتي بنفسي بوضوح",
              ),
              score: 3,
            },
          ],
        },
        {
          text: localized(
            "What do you want to understand more from your report?",
            "ما الذي تريد أن تفهمه أكثر من تقريرك",
          ),
          order: 2,
          choices: [
            {
              text: localized(
                "I have a clear picture and want only confirmation",
                "لدي صورة واضحة وأريد تأكيدها فقط",
              ),
              score: 1,
            },
            {
              text: localized(
                "A specific question like calories or weight stability",
                "سؤال محدد أريد إجابته مثل السعرات أو ثبات الوزن",
              ),
              score: 2,
            },
            {
              text: localized(
                "I want to understand why I don't reach results",
                "أريد فهم أسباب عدم وصولي للنتائج",
              ),
              score: 2,
            },
            {
              text: localized(
                "I feel confused and want comprehensive guidance",
                "أشعر بحيرة وأريد توجيهًا شاملاً",
              ),
              score: 3,
            },
          ],
        },
      ],
      resultRanges: sectionResultRanges({
        excellent: {
          en: "Excellent",
          ar: "ممتاز",
          min: 0,
          max: 2,
          recommendation: localized(
            "This level shows a good balance in motivation, as you seek to improve your body and health without the topic turning into continuous psychological pressure that affects your daily life. It is recommended to utilize this motivation in a healthy way, so that your goal serves as an incentive for movement and progress, without becoming a source of self-blame or constant pressure. The most sustainable progress stems from a calm and realistic tracking that respects the nature of change.",
            "يظهر هذا المستوى توازناً جيداً في الدافع، حيث تسعى لتحسين جسمك وصحتك دون أن يتحول الموضوع إلى ضغط نفسي مستمر يؤثر على حياتك اليومية. يُنصح بالاستفادة من هذا الدافع بطريقة صحية، بحيث يكون هدفك حافزاً للتحرك والتقدم، دون أن يصبح مصدر لوم ذاتي أو ضغط مستمر. التقدم الأكثر استدامة ينبع من متابعة هادئة وواقعية تُراعي طبيعة التغيير.",
          ),
        },
        good: {
          en: "Good",
          ar: "جيد",
          min: 3,
          max: 4,
          recommendation: localized(
            "This level reflects a space of dissatisfaction or questions that need clear answers, which can be positive if transformed into conscious understanding rather than psychological pressure. It is recommended to focus on the question most important to you, whether it relates to knowing calories, reasons for weight plateaus, or identifying the habit with the most impact. Clarity on this question makes reports and recommendations more useful and effective.",
            "يعكس هذا المستوى وجود مساحة من عدم الرضا أو تساؤلات تحتاج إلى إجابات واضحة، وهو أمر يمكن أن يكون إيجابياً إذا ما تحول إلى فهم واعٍ بدلاً من ضغط نفسي. يُنصح بالتركيز على السؤال الأكثر أهمية بالنسبة لك، سواء كان يتعلق بمعرفة السعرات الحرارية، أسباب ثبات الوزن، أو تحديد العادة الأكثر تأثيراً. ووضوح هذا السؤال يجعل التقارير والتوصيات أكثر فائدة وفعالية.",
          ),
        },
        average: {
          en: "Average",
          ar: "متوسط",
          min: 5,
          max: 5,
          recommendation: localized(
            "This level indicates that body image or anxiety linked to results might affect your decisions and behaviors, which could push you to rush or excessively compare yourself with others. It is important to expand progress indicators to include aspects other than appearance alone, such as energy levels, body measurements, sleep quality, and the extent of adherence to the plan. Relying on a single angle to evaluate the body leads to psychological exhaustion and quick burnout.",
            "يدل هذا المستوى على أن صورة الجسم أو القلق المرتبط بالنتائج قد يؤثران على قراراتك وسلوكياتك، مما قد يدفعك للاستعجال أو المقارنة المفرطة مع الآخرين. من المهم توسيع مؤشرات قياس التقدم لتشمل جوانب أخرى غير المظهر فقط، مثل مستويات الطاقة، مقاييس الجسم، جودة النوم، ومدى الالتزام بالخطة. الاعتماد على زاوية واحدة في تقييم الجسم يؤدي إلى الإجهاد النفسي وسرعة الانهيار.",
          ),
        },
        priority: {
          en: "Needs Attention",
          ar: "يحتاج لاهتمام",
          min: 6,
          max: 6,
          recommendation: localized(
            "At this level, motivation and body image require special care, as body shape may noticeably affect your self-confidence. Therefore, handling the goal must be smarter toward oneself, focusing on improving the relationship with the body during the change process and not just after achieving results. The true goal is sustainable health development without living under the weight of constant pressure caused by numbers or self-image.",
            "في هذا المستوى، يتطلب الدافع وصورة الجسم رعاية خاصة، إذ قد يؤثر شكل الجسم على ثقتك بنفسك بشكل ملحوظ. لذلك، يجب أن يكون التعامل مع الهدف أكثر ذكاءً تجاه النفس، مع التركيز على تحسين العلاقة مع الجسم أثناء عملية التغيير وليس فقط بعد تحقيق النتائج. الهدف الحقيقي هو التطور الصحي المستدام دون أن تعيش تحت وطأة ضغط دائم ناجم عن الأرقام أو الصورة الذاتية.",
          ),
        },
      }),
    },
    {
      title: localized("Additional Notes", "ملاحظات إضافية"),
      description: localized(
        "This section allows you to add any important notes for the specialist before the plan begins.",
        "هذا القسم مخصص لأي ملاحظات إضافية أو معلومات مهمة تود أن تعرفها الأخصائية قبل بداية الخطة.",
      ),
      order: 14,
      isOptional: true,
      questions: [
        {
          text: localized(
            "Is there any additional note or important information you want the specialist to know before starting the plan?",
            "هل هناك أي ملاحظات إضافية أو معلومات مهمة تحب أن تعرفها الأخصائية قبل بداية الخطة",
          ),
          order: 1,
        },
      ],
      isText: true,
    },
  ],
};
