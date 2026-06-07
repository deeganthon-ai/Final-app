import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = 'homefit_pro_10_full_v1';
const today = () => new Date().toISOString().slice(0, 10);
const toNum = v => Number(String(v ?? '').replace(',', '.')) || 0;
const round1 = v => Math.round((Number(v) || 0) * 10) / 10;
const uid = p => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const goals = [
  { key: 'Fat Loss', emoji: '🔥', caloriesFactor: 22, proteinFactor: 2.1, fatFactor: 0.7 },
  { key: 'Build Muscle', emoji: '💪', caloriesFactor: 32, proteinFactor: 1.9, fatFactor: 0.9 },
  { key: 'Recomp', emoji: '⚖️', caloriesFactor: 27, proteinFactor: 2.0, fatFactor: 0.8 },
  { key: 'Strength', emoji: '🏋️', caloriesFactor: 30, proteinFactor: 1.8, fatFactor: 0.85 },
  { key: 'Lean Bulk', emoji: '📈', caloriesFactor: 34, proteinFactor: 1.9, fatFactor: 0.9 },
  { key: 'Maintenance', emoji: '➡️', caloriesFactor: 29, proteinFactor: 1.8, fatFactor: 0.8 },
  { key: 'Men 40+ Strength', emoji: '🦾', caloriesFactor: 29, proteinFactor: 1.9, fatFactor: 0.85 },
  { key: 'Custom', emoji: '🎯', caloriesFactor: 27, proteinFactor: 2.0, fatFactor: 0.8 },
];

const starterFoods = [
  { id:'eggs', name:'Eggs, whole', brand:'Everyday food', servingG:100, calories:143, protein:13, carbs:1.1, fat:9.5, source:'Local' },
  { id:'scrambled', name:'Scrambled eggs with butter', brand:'Meal template', servingG:180, calories:360, protein:21, carbs:2, fat:30, source:'Local' },
  { id:'poached', name:'Poached eggs', brand:'Meal template', servingG:100, calories:143, protein:13, carbs:1.1, fat:9.5, source:'Local' },
  { id:'chicken', name:'Grilled chicken breast', brand:'Meal template', servingG:150, calories:248, protein:46.5, carbs:0, fat:5.4, source:'Local' },
  { id:'sains-chicken', name:"Sainsbury's chicken breast 150g", brand:"Sainsbury's style", servingG:150, calories:248, protein:46.5, carbs:0, fat:5.4, source:'Local' },
  { id:'morrisons-chicken', name:'Morrisons chicken breast 150g', brand:'Morrisons style', servingG:150, calories:248, protein:46.5, carbs:0, fat:5.4, source:'Local' },
  { id:'rice', name:'Cooked basmati rice', brand:'Normal supermarket food', servingG:250, calories:330, protein:7, carbs:74, fat:1, source:'Local' },
  { id:'milk', name:'Lactose-free semi skimmed milk', brand:'Normal supermarket food', servingG:250, calories:115, protein:9, carbs:12, fat:4, source:'Local' },
  { id:'beef', name:'Lean beef mince 5%', brand:'Normal supermarket food', servingG:250, calories:395, protein:65, carbs:0, fat:14, source:'Local' },
  { id:'oats', name:'Porridge oats', brand:'Normal supermarket food', servingG:80, calories:300, protein:10, carbs:50, fat:6, source:'Local' },
  { id:'tuna', name:'Tuna in spring water', brand:'Normal supermarket food', servingG:100, calories:116, protein:26, carbs:0, fat:1, source:'Local' },
  { id:'banana', name:'Banana', brand:'Normal supermarket food', servingG:120, calories:107, protein:1.3, carbs:27, fat:0.4, source:'Local' },
  { id:'potato', name:'Baked potato', brand:'Normal supermarket food', servingG:250, calories:233, protein:6, carbs:53, fat:0.3, source:'Local' },
  { id:'salmon', name:'Salmon fillet', brand:'Normal supermarket food', servingG:140, calories:280, protein:31, carbs:0, fat:17, source:'Local' },
  { id:'yogurt-lf', name:'Lactose-free Greek style yoghurt', brand:'Normal supermarket food', servingG:200, calories:146, protein:20, carbs:10, fat:2, source:'Local' },
  { id:'whey-beef', name:'Beef protein shake', brand:'Supplement template', servingG:30, calories:110, protein:24, carbs:1, fat:0.5, source:'Local' },
];

const ex = (name, day, muscle, equipment, sets=3, reps='8-12', targetReps=10, load='Moderate', rest=90, defaultKg=10, alt='') =>
  ({ name, day, muscle, equipment, sets, reps, targetReps, load, rest, defaultKg, alt });

const baseExercises = [
  // Push - chest
  ex('Barbell Bench Press','Push','chest',['Barbell','Bench'],4,'5-8',6,'Heavy',150,60,'Dumbbell Bench Press'),
  ex('Close-Grip Barbell Bench Press','Push','arms',['Barbell','Bench'],3,'6-10',8,'Heavy',120,45,'Tricep Bar Close-Grip Press'),
  ex('Barbell Floor Press','Push','chest',['Barbell'],4,'6-10',8,'Heavy',150,50,'Dumbbell Floor Press'),
  ex('5ft Barbell Floor Press','Push','chest',['5ft Standard Barbell'],4,'8-12',10,'Moderate',120,35,'Dumbbell Floor Press'),
  ex('Dumbbell Bench Press','Push','chest',['Dumbbells','Bench'],4,'8-12',10,'Moderate',120,17.5,'Single-Arm DB Floor Press'),
  ex('Incline Dumbbell Press','Push','chest',['Dumbbells','Bench'],3,'8-12',10,'Moderate',120,15,'Dumbbell Bench Press'),
  ex('Dumbbell Floor Press','Push','chest',['Dumbbells'],4,'8-12',10,'Moderate',120,17.5,'Push Ups'),
  ex('Single-Arm DB Floor Press','Push','chest',['Dumbbells'],3,'8-12 each',10,'Moderate',120,15,'Dumbbell Floor Press'),
  ex('Single-Arm DB Bench Press','Push','chest',['Dumbbells','Bench'],3,'8-12 each',10,'Moderate',120,15,'Dumbbell Bench Press'),
  ex('Dumbbell Fly Press Hybrid','Push','chest',['Dumbbells'],3,'10-12 each',11,'Light',90,8,'Push Ups'),
  ex('Dumbbell Squeeze Press','Push','chest',['Dumbbells'],3,'10-15',12,'Light',90,10,'Dumbbell Fly Press Hybrid'),
  ex('Dumbbell Fly','Push','chest',['Dumbbells','Bench'],3,'10-15',12,'Light',90,8,'Dumbbell Fly Press Hybrid'),
  ex('Push Ups','Push','chest',['Bodyweight'],3,'AMRAP',12,'Light',90,0,'Dumbbell Floor Press'),
  ex('Incline Push Ups','Push','chest',['Bodyweight','Bench'],3,'AMRAP',15,'Light',75,0,'Push Ups'),
  ex('Decline Push Ups','Push','chest',['Bodyweight','Bench'],3,'AMRAP',10,'Moderate',90,0,'Push Ups'),
  ex('Diamond Push Ups','Push','arms',['Bodyweight'],3,'AMRAP',10,'Moderate',90,0,'Close-Grip Push Ups'),
  ex('Close-Grip Push Ups','Push','arms',['Bodyweight'],3,'AMRAP',10,'Light',90,0,'Diamond Push Ups'),
  // Push - shoulders / triceps
  ex('Dumbbell Shoulder Press','Push','shoulders',['Dumbbells'],4,'8-12',10,'Moderate',120,12.5,'Single-Arm DB Shoulder Press'),
  ex('Single-Arm DB Shoulder Press','Push','shoulders',['Dumbbells'],3,'8-12 each',10,'Moderate',120,10,'Dumbbell Shoulder Press'),
  ex('Seated DB Shoulder Press','Push','shoulders',['Dumbbells','Bench'],4,'8-12',10,'Moderate',120,12.5,'Dumbbell Shoulder Press'),
  ex('Barbell Overhead Press','Push','shoulders',['Barbell'],4,'5-8',6,'Heavy',150,35,'Dumbbell Shoulder Press'),
  ex('5ft Barbell Overhead Press','Push','shoulders',['5ft Standard Barbell'],3,'6-10',8,'Moderate',120,30,'Dumbbell Shoulder Press'),
  ex('Barbell Push Press','Push','shoulders',['Barbell'],3,'5-8',6,'Heavy',150,35,'DB Clean and Press'),
  ex('DB Clean and Press','Push','shoulders',['Dumbbells'],3,'6-8 each',8,'Moderate',120,12.5,'Dumbbell Shoulder Press'),
  ex('Arnold Press','Push','shoulders',['Dumbbells'],3,'8-12',10,'Moderate',120,10,'Dumbbell Shoulder Press'),
  ex('DB Lateral Raise','Push','shoulders',['Dumbbells'],4,'12-20',15,'Light',75,6,'Lean-Away Lateral Raise'),
  ex('Lean-Away Lateral Raise','Push','shoulders',['Dumbbells'],3,'12-20 each',15,'Light',75,5,'DB Lateral Raise'),
  ex('Front Raise','Push','shoulders',['Dumbbells'],3,'10-15',12,'Light',75,6,'Plate Raise'),
  ex('Upright Row','Push','shoulders',['Dumbbells'],3,'10-15',12,'Light',90,10,'DB Lateral Raise'),
  ex('Lying Tricep Bar Extension','Push','arms',['Tricep Bar'],3,'10-12',11,'Light',90,15,'Close-Grip Push Ups'),
  ex('Tricep Bar Close-Grip Press','Push','arms',['Tricep Bar'],3,'8-12',10,'Moderate',90,20,'Close-Grip Barbell Bench Press'),
  ex('Single-Arm Overhead Tricep Extension','Push','arms',['Dumbbells'],3,'10-15 each',12,'Light',75,7.5,'Tricep Bar Extension'),
  ex('Dumbbell Skull Crusher','Push','arms',['Dumbbells'],3,'10-15',12,'Light',90,8,'Lying Tricep Bar Extension'),
  ex('DB Press-Out Burnout','Push','chest',['Dumbbells'],2,'20-30',25,'Light',60,5,'Push Ups'),
  ex('Kettlebell Floor Press','Push','chest',['Kettlebells'],3,'8-12',10,'Moderate',120,16,'Dumbbell Floor Press'),
  ex('Single-Arm Kettlebell Floor Press','Push','chest',['Kettlebells'],3,'8-12 each',10,'Moderate',120,16,'Single-Arm DB Floor Press'),
  ex('Kettlebell Strict Press','Push','shoulders',['Kettlebells'],3,'6-10 each',8,'Moderate',120,12,'Single-Arm DB Shoulder Press'),
  ex('Kettlebell Push Press','Push','shoulders',['Kettlebells'],3,'6-10 each',8,'Moderate',120,16,'Barbell Push Press'),
  ex('Kettlebell Halo','Push','shoulders',['Kettlebells'],3,'8-12 each way',10,'Light',60,8,'Front Raise'),
  ex('York Multi Gym Chest Press','Push','chest',['York Multi Gym'],4,'8-12',10,'Moderate',120,35,'Dumbbell Bench Press'),
  ex('York Multi Gym Pec Deck Fly','Push','chest',['York Multi Gym'],3,'10-15',12,'Light',90,25,'Dumbbell Fly Press Hybrid'),
  ex('York Multi Gym Cable Pressdown','Push','arms',['York Multi Gym'],3,'10-15',12,'Light',75,20,'Lying Tricep Bar Extension'),
  ex('York Multi Gym Cable Lateral Raise','Push','shoulders',['York Multi Gym'],3,'12-20 each',15,'Light',60,7.5,'DB Lateral Raise'),

  // Pull
  ex('Barbell Bent-Over Row','Pull','back',['Barbell'],4,'6-10',8,'Heavy',150,50,'One-Arm Dumbbell Row'),
  ex('5ft Barbell Bent-Over Row','Pull','back',['5ft Standard Barbell'],4,'8-12',10,'Moderate',120,35,'One-Arm Dumbbell Row'),
  ex('Pendlay Row','Pull','back',['Barbell'],4,'5-8',6,'Heavy',150,45,'Barbell Bent-Over Row'),
  ex('Chest-Supported Dumbbell Row','Pull','back',['Dumbbells','Bench'],4,'8-12',10,'Moderate',120,17.5,'One-Arm Dumbbell Row'),
  ex('One-Arm Dumbbell Row','Pull','back',['Dumbbells'],4,'10-12 each',11,'Moderate',120,20,'Chest-Supported Dumbbell Row'),
  ex('Dumbbell Pullover','Pull','back',['Dumbbells','Bench'],3,'10-15',12,'Light',90,12.5,'Floor Pullover'),
  ex('Floor Dumbbell Pullover','Pull','back',['Dumbbells'],3,'10-15',12,'Light',90,12.5,'Dumbbell Pullover'),
  ex('Barbell Romanian Deadlift','Pull','back',['Barbell'],3,'6-10',8,'Heavy',150,60,'DB Romanian Deadlift'),
  ex('5ft Barbell Romanian Deadlift','Pull','back',['5ft Standard Barbell'],3,'8-12',10,'Moderate',120,40,'DB Romanian Deadlift'),
  ex('Rear Delt Dumbbell Fly','Pull','shoulders',['Dumbbells'],4,'12-20',15,'Light',75,5,'Prone Y Raise'),
  ex('Prone Y Raise','Pull','shoulders',['Dumbbells','Bench'],3,'12-15',12,'Light',75,3,'Rear Delt Dumbbell Fly'),
  ex('DB Shrugs','Pull','back',['Dumbbells'],4,'10-15',12,'Moderate',90,22.5,'Barbell Shrugs'),
  ex('Barbell Shrugs','Pull','back',['Barbell'],4,'8-12',10,'Heavy',120,70,'DB Shrugs'),
  ex('Dumbbell Curl','Pull','arms',['Dumbbells'],3,'10-12',11,'Light',90,10,'Hammer Curl'),
  ex('Hammer Curl','Pull','arms',['Dumbbells'],3,'8-12',10,'Moderate',90,12.5,'Dumbbell Curl'),
  ex('Cross-Body Hammer Curl','Pull','arms',['Dumbbells'],3,'10-12 each',11,'Light',75,10,'Hammer Curl'),
  ex('Concentration Curl','Pull','arms',['Dumbbells'],3,'10-15 each',12,'Light',75,8,'Dumbbell Curl'),
  ex('Zottman Curl','Pull','arms',['Dumbbells'],3,'10-12',11,'Light',90,8,'Hammer Curl'),
  ex('Reverse Curl','Pull','arms',['Barbell'],3,'10-15',12,'Light',90,20,'Tricep Bar Curl'),
  ex('Barbell Curl','Pull','arms',['Barbell'],3,'8-12',10,'Moderate',90,25,'Dumbbell Curl'),
  ex('5ft Barbell Curl','Pull','arms',['5ft Standard Barbell'],3,'8-12',10,'Moderate',90,25,'Dumbbell Curl'),
  ex('Tricep Bar Curl','Pull','arms',['Tricep Bar'],3,'10-12',11,'Light',90,15,'Hammer Curl'),
  ex('Renegade Row','Pull','back',['Dumbbells'],3,'6-10 each',8,'Moderate',120,10,'One-Arm DB Row'),
  ex('Kettlebell Row','Pull','back',['Kettlebells'],4,'8-12 each',10,'Moderate',120,16,'One-Arm Dumbbell Row'),
  ex('Kettlebell High Pull','Pull','back',['Kettlebells'],3,'8-12 each',10,'Moderate',120,12,'Rear Delt Dumbbell Fly'),
  ex('Kettlebell Shrug','Pull','back',['Kettlebells'],3,'10-15',12,'Moderate',90,20,'DB Shrugs'),
  ex('Kettlebell Hammer Curl','Pull','arms',['Kettlebells'],3,'8-12',10,'Light',90,8,'Hammer Curl'),
  ex('York Multi Gym Lat Pulldown','Pull','back',['York Multi Gym'],4,'8-12',10,'Moderate',120,40,'One-Arm Dumbbell Row'),
  ex('York Multi Gym Seated Cable Row','Pull','back',['York Multi Gym'],4,'8-12',10,'Moderate',120,40,'Barbell Bent-Over Row'),
  ex('York Multi Gym Face Pull','Pull','shoulders',['York Multi Gym'],3,'12-20',15,'Light',75,15,'Rear Delt Dumbbell Fly'),
  ex('York Multi Gym Cable Curl','Pull','arms',['York Multi Gym'],3,'10-15',12,'Light',75,20,'Dumbbell Curl'),

  // Legs
  ex('Barbell Back Squat','Legs','legs',['Barbell'],4,'5-8',6,'Heavy',150,60,'Goblet Squat'),
  ex('Barbell Front Squat','Legs','legs',['Barbell'],3,'5-8',6,'Heavy',150,45,'Goblet Squat'),
  ex('5ft Barbell Front Squat','Legs','legs',['5ft Standard Barbell'],3,'8-12',10,'Moderate',120,35,'Goblet Squat'),
  ex('Goblet Squat','Legs','legs',['Dumbbells'],4,'10-15',12,'Moderate',120,22.5,'Bodyweight Squat'),
  ex('Kettlebell Goblet Squat','Legs','legs',['Kettlebells'],4,'10-15',12,'Moderate',120,20,'Goblet Squat'),
  ex('Double Kettlebell Front Squat','Legs','legs',['Kettlebells'],3,'8-12',10,'Moderate',120,16,'Goblet Squat'),
  ex('Box Squat','Legs','legs',['Barbell','Bench'],3,'6-10',8,'Moderate',120,50,'Goblet Squat'),
  ex('Barbell Romanian Deadlift','Legs','legs',['Barbell'],4,'6-10',8,'Heavy',150,60,'DB Romanian Deadlift'),
  ex('5ft Barbell Romanian Deadlift','Legs','legs',['5ft Standard Barbell'],4,'8-12',10,'Moderate',120,40,'DB Romanian Deadlift'),
  ex('DB Romanian Deadlift','Legs','legs',['Dumbbells'],4,'8-12',10,'Moderate',120,20,'Hip Hinge'),
  ex('Kettlebell Romanian Deadlift','Legs','legs',['Kettlebells'],4,'8-12',10,'Moderate',120,20,'DB Romanian Deadlift'),
  ex('Kettlebell Sumo Deadlift','Legs','legs',['Kettlebells'],4,'10-15',12,'Moderate',120,24,'Goblet Squat'),
  ex('Dumbbell Split Squat','Legs','legs',['Dumbbells'],3,'8-10 each',9,'Moderate',120,12.5,'Reverse Lunge'),
  ex('Bulgarian Split Squat','Legs','legs',['Dumbbells','Bench'],3,'8-10 each',9,'Moderate',120,10,'Dumbbell Split Squat'),
  ex('Reverse Lunge','Legs','legs',['Dumbbells'],3,'8-12 each',10,'Moderate',120,10,'Split Squat'),
  ex('Kettlebell Reverse Lunge','Legs','legs',['Kettlebells'],3,'8-12 each',10,'Moderate',120,12,'Reverse Lunge'),
  ex('Step Up','Legs','legs',['Dumbbells','Bench'],3,'8-12 each',10,'Moderate',120,10,'Reverse Lunge'),
  ex('Kettlebell Step Up','Legs','legs',['Kettlebells','Bench'],3,'8-12 each',10,'Moderate',120,12,'Step Up'),
  ex('Bodyweight Squat','Legs','legs',['Bodyweight'],3,'15-25',20,'Light',75,0,'Wall Sit'),
  ex('Wall Sit','Legs','legs',['Bodyweight'],3,'30-60 sec',45,'Light',75,0,'Bodyweight Squat'),
  ex('Calf Raise','Legs','legs',['Dumbbells'],4,'12-20',15,'Light',75,15,'Bodyweight Calf Raise'),
  ex('Single-Leg Calf Raise','Legs','legs',['Bodyweight'],4,'12-20 each',15,'Light',75,0,'Calf Raise'),
  ex('Kettlebell Calf Raise','Legs','legs',['Kettlebells'],4,'12-20',15,'Light',75,16,'Calf Raise'),
  ex('Glute Bridge','Legs','legs',['Bodyweight'],3,'12-20',15,'Light',75,0,'Hip Thrust'),
  ex('Hip Thrust','Legs','legs',['Dumbbells','Bench'],3,'10-15',12,'Moderate',90,20,'Glute Bridge'),
  ex('York Multi Gym Leg Extension','Legs','legs',['York Multi Gym'],3,'10-15',12,'Moderate',90,35,'Goblet Squat'),
  ex('York Multi Gym Hamstring Curl','Legs','legs',['York Multi Gym'],3,'10-15',12,'Moderate',90,25,'DB Romanian Deadlift'),

  // Core and conditioning
  ex('Sit Ups','Legs','core',['Bodyweight'],3,'12-20',15,'Light',75,0,'Crunches'),
  ex('Crunches','Legs','core',['Bodyweight'],3,'15-25',20,'Light',60,0,'Sit Ups'),
  ex('Reverse Crunch','Legs','core',['Bodyweight'],3,'12-20',15,'Light',60,0,'Crunches'),
  ex('Bicycle Crunch','Legs','core',['Bodyweight'],3,'20-40',30,'Light',60,0,'Russian Twist'),
  ex('Plank','Legs','core',['Bodyweight'],3,'30-60 sec',45,'Light',75,0,'Dead Bug'),
  ex('Side Plank','Legs','core',['Bodyweight'],3,'20-45 sec each',30,'Light',60,0,'Plank'),
  ex('Dead Bug','Pull','core',['Bodyweight'],3,'10 each',10,'Light',60,0,'Plank'),
  ex('Bird Dog','Pull','core',['Bodyweight'],3,'10 each',10,'Light',60,0,'Dead Bug'),
  ex('Russian Twist','Legs','core',['Bodyweight'],3,'16-30',20,'Light',60,0,'Sit Ups'),
  ex('Kettlebell Russian Twist','Legs','core',['Kettlebells'],3,'16-30',20,'Light',60,8,'Russian Twist'),
  ex('Kettlebell Windmill','Legs','core',['Kettlebells'],3,'6-10 each',8,'Light',75,8,'Side Plank'),
  ex('Kettlebell Suitcase Carry','Legs','core',['Kettlebells'],3,'45-60 sec each',45,'Moderate',75,20,'Farmer Carry March'),
  ex('Farmer Carry March','Legs','core',['Dumbbells'],3,'45-60 sec',45,'Moderate',75,20,'Plank'),
  ex('York Multi Gym Cable Crunch','Legs','core',['York Multi Gym'],3,'12-20',15,'Light',75,20,'Sit Ups'),
  ex('Mountain Climbers','Legs','conditioning',['Bodyweight'],3,'30-45 sec',35,'Light',60,0,'Plank'),
  ex('Bear Crawl Hold','Legs','conditioning',['Bodyweight'],3,'20-40 sec',30,'Light',60,0,'Plank'),
  ex('Burpee','Legs','conditioning',['Bodyweight'],3,'8-15',10,'Moderate',90,0,'Bodyweight Squat'),
  ex('Shadow Boxing','Push','conditioning',['Bodyweight'],3,'60 sec',60,'Light',60,0,'Push Ups'),
  ex('High Knees','Legs','conditioning',['Bodyweight'],3,'30-45 sec',35,'Light',60,0,'Mountain Climbers'),
  ex('Jumping Jacks','Legs','conditioning',['Bodyweight'],3,'45-60 sec',45,'Light',60,0,'High Knees'),
  ex('Kettlebell Swing','Legs','conditioning',['Kettlebells'],5,'15-20',15,'Moderate',75,16,'Kettlebell Sumo Deadlift'),
  ex('Single-Arm Kettlebell Swing','Legs','conditioning',['Kettlebells'],4,'10-15 each',12,'Moderate',75,12,'Kettlebell Swing'),
  ex('Kettlebell Clean and Press','Push','conditioning',['Kettlebells'],4,'6-8 each',8,'Moderate',120,12,'DB Clean and Press'),
  ex('Kettlebell Snatch','Pull','conditioning',['Kettlebells'],4,'6-10 each',8,'Heavy',120,12,'Kettlebell High Pull'),
  ex('Kettlebell Thruster','Legs','conditioning',['Kettlebells'],4,'8-12',10,'Heavy',120,12,'Kettlebell Goblet Squat'),
  ex('Treadmill Walk','Legs','conditioning',['Treadmill'],1,'20 min',20,'Light',0,0,'Outdoor Walk'),
  ex('Incline Treadmill Walk','Legs','conditioning',['Treadmill'],1,'20 min',20,'Moderate',0,0,'Treadmill Walk'),
  ex('Treadmill Jog','Legs','conditioning',['Treadmill'],1,'15 min',15,'Moderate',0,0,'Incline Treadmill Walk'),
  ex('Treadmill Run','Legs','conditioning',['Treadmill'],1,'10 min',10,'Heavy',0,0,'Treadmill Jog'),
  ex('HIIT Treadmill Sprints','Legs','conditioning',['Treadmill'],10,'30 sec',10,'Heavy',60,0,'Treadmill Run'),
];

const defaultState = {
  tab:'Dashboard',
  profile:{ goal:'Recomp', calories:2300, protein:180, carbs:220, fat:75, weight:92, height:178, age:43 },
  equipment:[
    {id:'body',name:'Bodyweight',enabled:true,maxKg:0},
    {id:'db',name:'Dumbbells',enabled:true,maxKg:25},
    {id:'bb',name:'Barbell',enabled:true,maxKg:100},
    {id:'stdbar',name:'5ft Standard Barbell',enabled:true,maxKg:50},
    {id:'tri',name:'Tricep Bar',enabled:true,maxKg:40},
    {id:'kb',name:'Kettlebells',enabled:true,maxKg:32},
    {id:'york',name:'York Multi Gym',enabled:true,maxKg:70},
    {id:'tm',name:'Treadmill',enabled:true,maxKg:0},
    {id:'bench',name:'Bench',enabled:true,maxKg:0}
  ],
  meals:[], favourites:starterFoods, savedMeals:[], recentFoods:[], progress:[], workouts:[], customExercises:[], water:[], waterTarget:2500,
  recovery:{ chest:3, back:3, legs:3, shoulders:3, arms:3, energy:3, sleep:3, soreness:3, stress:3 }, backupText:''
};

export default function App(){
  const [state,setState]=useState(defaultState); const [target,setTarget]=useState(defaultState.profile);
  const [query,setQuery]=useState(''); const [barcode,setBarcode]=useState(''); const [results,setResults]=useState([]); const [selected,setSelected]=useState(null); const [portion,setPortion]=useState('100'); const [loading,setLoading]=useState(false);
  const [customFood,setCustomFood]=useState({name:'',calories:'',protein:'',carbs:'',fat:'',servingG:'100'}); const [mealName,setMealName]=useState('');
  const [progress,setProgress]=useState({weight:'',waist:'',chest:'',arms:'',thighs:''}); const [exDraft,setExDraft]=useState({name:'',day:'Push',muscle:'chest',equipment:'Dumbbells',sets:'3',reps:'8-12',targetReps:'10',load:'Moderate',rest:'90',defaultKg:'10'});
  const [equipDraft,setEquipDraft]=useState({name:'',maxKg:''}); const [exerciseQuery,setExerciseQuery]=useState(''); const [muscleFilter,setMuscleFilter]=useState('all'); const [workoutDraft,setWorkoutDraft]=useState([]); const [selectedWorkout,setSelectedWorkout]=useState(null); const [seconds,setSeconds]=useState(0); const [scanner,setScanner]=useState(false); const [scanned,setScanned]=useState(false); const [waterDraft,setWaterDraft]=useState('500'); const [backupInput,setBackupInput]=useState('');
  const [showDatabase,setShowDatabase]=useState(false); const [swapIndex,setSwapIndex]=useState(null); const [insertIndex,setInsertIndex]=useState(null);
  const [permission, requestPermission]=useCameraPermissions(); const timer=useRef(null);

  useEffect(()=>{AsyncStorage.getItem(STORAGE_KEY).then(v=>{ if(v){ const p=JSON.parse(v); setState({...defaultState,...p}); setTarget({...defaultState.profile,...p.profile}); }}).catch(()=>{});},[]);
  useEffect(()=>{AsyncStorage.setItem(STORAGE_KEY,JSON.stringify(state)).catch(()=>{});},[state]);
  useEffect(()=>()=>timer.current&&clearInterval(timer.current),[]);

  const mealsToday=state.meals.filter(m=>m.date===today()); const totals=macroTotals(mealsToday); const enabled=state.equipment.filter(e=>e.enabled).map(e=>e.name); const allExercises=[...baseExercises,...state.customExercises];
  const nextDay=['Push','Pull','Legs'][state.workouts.length%3]; const prs=useMemo(()=>getPRs(state.workouts),[state.workouts]); const weeklyVolume=volumeLast7(state.workouts); const waterToday=sum(state.water.filter(w=>w.date===today()).map(w=>w.ml));
  const generated=useMemo(()=>allExercises.filter(e=>e.day===nextDay).filter(e=>e.equipment.every(eq=>enabled.includes(eq))).slice(0,8).map(e=>({...e,suggestedKg:suggestKg(e,state.workouts)})),[nextDay,enabled.join('|'),state.workouts.length,state.customExercises.length]);
  useEffect(()=>setWorkoutDraft(generated.map(e=>({...e,setsDone:Array.from({length:e.sets},()=>({kg:e.suggestedKg,reps:e.targetReps,rest:e.rest}))}))),[generated.map(e=>e.name+e.suggestedKg).join('|')]);
  const draftVolume=workoutVolume(workoutDraft); const week=getWeek(state); const streak=getStreak(state); const coach=getCoach(state,totals,week);
  const exerciseDatabase=allExercises.filter(e=>(muscleFilter==='all'||e.muscle===muscleFilter)).filter(e=>(e.name+' '+e.day+' '+e.muscle+' '+e.equipment.join(' ')).toLowerCase().includes(exerciseQuery.toLowerCase())).slice(0,200);

  function patch(p){setState(s=>({...s,...p}));}
  function makeDraftItem(item){const kg=suggestKg(item,state.workouts); return {...item,suggestedKg:kg,setsDone:Array.from({length:item.sets},()=>({kg,reps:item.targetReps,rest:item.rest}))};}
  function startRest(sec){ if(timer.current)clearInterval(timer.current); setSeconds(sec); timer.current=setInterval(()=>setSeconds(x=>{ if(x<=1){clearInterval(timer.current);timer.current=null;return 0;} return x-1;}),1000); }
  async function openScanner(){ if(!permission?.granted){ const r=await requestPermission(); if(!r.granted)return Alert.alert('Camera permission needed','Allow camera access to scan barcodes.'); } setScanned(false); setScanner(true); }
  async function onScan(r){ if(scanned)return; setScanned(true); setScanner(false); await barcodeSearch(r?.data); }
  async function barcodeSearch(code=barcode){ const c=String(code||'').trim(); if(!c)return; setBarcode(c); setLoading(true); try{ const res=await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(c)}.json`); const j=await res.json(); if(j.status!==1){Alert.alert('Food not found','Use manual search or create a custom food.');return;} const f=mapFood(j.product); if(f){setResults([f]);setSelected(f);setPortion(String(f.servingG||100));} }catch(err){Alert.alert('Lookup failed','Check internet or add food manually.');}finally{setLoading(false);} }
  async function foodSearch(){ if(!query.trim())return; setLoading(true); try{ const res=await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,brands,nutriments,serving_quantity`); const j=await res.json(); const rows=(j.products||[]).map(mapFood).filter(Boolean); setResults(rows); if(!rows.length)Alert.alert('No foods found','Try another search or add custom food.'); }catch(err){Alert.alert('Search failed','Check internet or add custom food.');}finally{setLoading(false);} }
  function addFood(food=selected,g=portion){ if(!food)return; const mult=toNum(g)/100; const item={id:uid('meal'),date:today(),name:food.name,brand:food.brand,grams:toNum(g),calories:round1(food.calories*mult),protein:round1(food.protein*mult),carbs:round1(food.carbs*mult),fat:round1(food.fat*mult),source:food.source}; setState(s=>({...s,meals:[...s.meals,item],recentFoods:[food,...s.recentFoods.filter(f=>f.id!==food.id)].slice(0,10)})); setSelected(null); }
  function removeMeal(id){ patch({meals:state.meals.filter(m=>m.id!==id)}); }
  function saveCustomFood(){ if(!customFood.name.trim())return; const serving=toNum(customFood.servingG)||100; const f={id:uid('custom'),name:customFood.name.trim(),brand:'Custom',servingG:serving,calories:round1(toNum(customFood.calories)/serving*100),protein:round1(toNum(customFood.protein)/serving*100),carbs:round1(toNum(customFood.carbs)/serving*100),fat:round1(toNum(customFood.fat)/serving*100),source:'Custom'}; patch({favourites:[f,...state.favourites]}); setCustomFood({name:'',calories:'',protein:'',carbs:'',fat:'',servingG:'100'}); }
  function saveMealTemplate(){ if(!mealsToday.length)return; const name=mealName.trim()||`Meal ${state.savedMeals.length+1}`; patch({savedMeals:[{id:uid('savedmeal'),name,items:mealsToday,totals},...state.savedMeals].slice(0,20)}); setMealName(''); }
  function logSavedMeal(meal){ patch({meals:[...state.meals,...meal.items.map(i=>({...i,id:uid('meal'),date:today()}))]}); }
  function logWorkout(){ const exercises=workoutDraft.map(item=>({...item,setsDone:item.setsDone.map(s=>({kg:toNum(s.kg),reps:toNum(s.reps),rest:toNum(s.rest)||item.rest}))})); const w={id:uid('workout'),date:today(),day:nextDay,exercises,volume:workoutVolume(exercises)}; patch({workouts:[...state.workouts,w]}); startRest(exercises[0]?.rest||90); Alert.alert('Workout logged',`${nextDay} saved. Volume ${w.volume}kg.`); }
  function updateSet(i,j,k,v){ setWorkoutDraft(w=>w.map((item,ei)=>ei!==i?item:{...item,setsDone:item.setsDone.map((s,si)=>si!==j?s:{...s,[k]:v})})); }
  function addExerciseToDraft(item){ const made=makeDraftItem(item); setWorkoutDraft(w=>insertIndex===null?[...w,made]:[...w.slice(0,insertIndex+1),made,...w.slice(insertIndex+1)]); setInsertIndex(null); setShowDatabase(false); }
  function swapDraftExercise(index,item){ setWorkoutDraft(w=>w.map((old,i)=>i===index?makeDraftItem(item):old)); setSwapIndex(null); setShowDatabase(false); }
  function removeDraftExercise(index){ setWorkoutDraft(w=>w.filter((_,i)=>i!==index)); if(swapIndex===index)setSwapIndex(null); if(insertIndex===index)setInsertIndex(null); }
  function openAddBelow(i){setInsertIndex(i);setSwapIndex(null);setShowDatabase(true);}
  function openSwap(i){setSwapIndex(i);setInsertIndex(null);setShowDatabase(true);}
  function saveTargets(){ patch({profile:{...target,calories:toNum(target.calories),protein:toNum(target.protein),carbs:toNum(target.carbs),fat:toNum(target.fat),weight:toNum(target.weight)}}); Alert.alert('Saved','Daily goals updated.'); }
  function calculateTargets(goal=target.goal, weight=toNum(target.weight)){ const g=goals.find(x=>x.key===goal)||goals[2]; const calories=Math.round(weight*g.caloriesFactor); const protein=Math.round(weight*g.proteinFactor); const fat=Math.round(weight*g.fatFactor); const carbs=Math.max(50,Math.round((calories-protein*4-fat*9)/4)); setTarget({...target,goal,weight,calories,protein,carbs,fat}); }
  function autoCalories(){ const h=state.progress.filter(p=>toNum(p.weight)>0).slice(-4); if(h.length<2)return Alert.alert('Need weigh-ins','Add at least two bodyweight entries.'); const change=round1(h[h.length-1].weight-h[0].weight); let adj=0; if(state.profile.goal==='Fat Loss'&&change>=0)adj=-150; if(state.profile.goal==='Build Muscle'&&change<=0)adj=150; if(state.profile.goal==='Recomp'&&Math.abs(change)>1.5)adj=change>0?-100:100; const profile={...state.profile,calories:Math.max(1400,state.profile.calories+adj)}; patch({profile}); setTarget(profile); Alert.alert('Calories adjusted',adj?`${adj} kcal. Weight change ${change}kg.`:'No change needed.'); }
  function addProgress(){ patch({progress:[...state.progress,{id:uid('prog'),date:today(),weight:toNum(progress.weight),waist:toNum(progress.waist),chest:toNum(progress.chest),arms:toNum(progress.arms),thighs:toNum(progress.thighs)}]}); setProgress({weight:'',waist:'',chest:'',arms:'',thighs:''}); }
  function addWater(ml=waterDraft){ const amount=Math.round(toNum(ml)); if(!amount)return; patch({water:[...state.water,{id:uid('water'),date:today(),ml:amount}]}); }
  function toggleEq(id){ patch({equipment:state.equipment.map(item=>item.id===id?{...item,enabled:!item.enabled}:item)}); }
  function addEq(){ if(!equipDraft.name.trim())return; patch({equipment:[...state.equipment,{id:uid('eq'),name:equipDraft.name.trim(),enabled:true,maxKg:toNum(equipDraft.maxKg)}]}); setEquipDraft({name:'',maxKg:''}); }
  function addExercise(){ if(!exDraft.name.trim())return; const item={name:exDraft.name.trim(),day:exDraft.day,muscle:exDraft.muscle,equipment:exDraft.equipment.split(',').map(x=>x.trim()).filter(Boolean),sets:toNum(exDraft.sets)||3,reps:exDraft.reps,targetReps:toNum(exDraft.targetReps)||10,load:exDraft.load,rest:toNum(exDraft.rest)||90,defaultKg:toNum(exDraft.defaultKg),custom:true}; patch({customExercises:[item,...state.customExercises]}); setExDraft({name:'',day:'Push',muscle:'chest',equipment:'Dumbbells',sets:'3',reps:'8-12',targetReps:'10',load:'Moderate',rest:'90',defaultKg:'10'}); }
  function backup(){ const b=JSON.stringify({...state,tab:'Dashboard'},null,2); patch({backupText:b}); setBackupInput(b); }
  function restore(){ try{ const p=JSON.parse(backupInput); setState({...defaultState,...p}); Alert.alert('Restored','Backup restored.'); }catch(err){Alert.alert('Restore failed','Backup text is not valid JSON.');} }

  if(scanner) return <SafeAreaView style={styles.app}><StatusBar style="light"/><CameraView style={styles.camera} facing="back" barcodeScannerSettings={{barcodeTypes:['ean13','ean8','upc_a','upc_e','code128','code39','itf14']}} onBarcodeScanned={scanned?undefined:onScan}/><View style={styles.cameraOverlay}><Text style={styles.hero}>Scan barcode</Text><Text style={styles.text}>Point at the food barcode. Nutrition loads from Open Food Facts.</Text><Button danger label="Cancel scanner" onPress={()=>setScanner(false)}/></View></SafeAreaView>;

  return <SafeAreaView style={styles.app}><StatusBar style="light"/><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1}}><View style={styles.header}><Text style={styles.title}>HomeFit Pro 10</Text><Text style={styles.subtitle}>Fitbod-style training + nutrition</Text></View><ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
    {state.tab==='Dashboard'&&<View><Card title="Today" badge={state.profile.goal}><Text style={styles.hero}>{nextDay} Day</Text><Text style={styles.text}>Calories {totals.calories}/{state.profile.calories} kcal</Text><Text style={styles.text}>Protein {totals.protein}/{state.profile.protein}g</Text><Bar value={totals.calories} max={state.profile.calories}/></Card><Card title="Pro Dashboard" badge="7 days"><View style={styles.grid}><Stat label="Workouts" value={week.workouts}/><Stat label="Avg cals" value={week.avgCalories}/><Stat label="Protein" value={`${week.avgProtein}g`}/><Stat label="Weight" value={`${week.weightChange}kg`}/></View></Card><Card title="Water" badge={`${waterToday}/${state.waterTarget}ml`}><Bar value={waterToday} max={state.waterTarget}/><View style={styles.row}><Input small value={waterDraft} onChangeText={setWaterDraft} keyboardType="decimal-pad"/><Text style={styles.muted}>ml</Text><Button secondary label="Add" onPress={()=>addWater()}/></View><View style={styles.choiceRow}>{[250,500,750].map(x=><Button key={x} secondary label={`+${x}`} onPress={()=>addWater(x)}/>)}</View></Card><Card title="Weekly Coaching" badge="AI-style"><Text style={styles.text}>{coach}</Text></Card><Card title="Training Stats"><Text style={styles.text}>Streak: {streak} days</Text><Text style={styles.text}>7-day volume: {weeklyVolume}kg</Text>{seconds>0&&<Text style={styles.hero}>Rest {format(seconds)}</Text>}</Card><Card title="Recent PRs">{Object.keys(prs).length===0?<Text style={styles.muted}>PRs appear after logging workouts.</Text>:Object.entries(prs).slice(0,6).map(([n,p])=><Text key={n} style={styles.text}>{n}: {p.kg}kg x {p.reps}</Text>)}</Card></View>}
    {state.tab==='Train'&&<View><Card title={`Smart ${nextDay} Workout`} badge="PPL + home gym"><Text style={styles.muted}>Each exercise has Add, Swap and Remove. Exercise database stays hidden until needed.</Text><Text style={styles.text}>Draft volume: {draftVolume}kg</Text>{workoutDraft.map((item,i)=><View key={`${item.name}-${i}`} style={styles.exercise}><Text style={styles.exerciseName}>{i+1}. {item.name}</Text><Text style={styles.muted}>{item.sets} sets • {item.reps} • {item.load} • Rest {item.rest}s</Text><Text style={styles.text}>Suggested: {item.suggestedKg}kg</Text><View style={styles.choiceRow}><Button secondary label="Add Below" onPress={()=>openAddBelow(i)}/><Button secondary label="Swap" onPress={()=>openSwap(i)}/><Button danger label="Remove" onPress={()=>removeDraftExercise(i)}/></View>{item.setsDone.map((s,j)=><View key={j} style={styles.row}><Text style={styles.setLabel}>Set {j+1}</Text><Input small value={String(s.kg)} onChangeText={v=>updateSet(i,j,'kg',v)} keyboardType="decimal-pad"/><Text style={styles.muted}>kg</Text><Input small value={String(s.reps)} onChangeText={v=>updateSet(i,j,'reps',v)} keyboardType="decimal-pad"/><Text style={styles.muted}>reps</Text></View>)}<Button secondary label={`Start ${item.rest}s rest`} onPress={()=>startRest(item.rest)}/></View>)}<Button secondary label="Add Exercise to End" onPress={()=>{setInsertIndex(workoutDraft.length-1);setSwapIndex(null);setShowDatabase(true);}}/><Button label="Log this workout" onPress={logWorkout}/></Card><Button secondary label={showDatabase?'Hide Exercise Database':'Show Exercise Database'} onPress={()=>{setShowDatabase(!showDatabase); if(showDatabase){setSwapIndex(null);setInsertIndex(null);}}}/>{showDatabase&&<Card title="Exercise Database" badge={`${exerciseDatabase.length}/${allExercises.length}`}><Text style={styles.muted}>{swapIndex!==null?`Choose replacement for exercise ${swapIndex+1}`:insertIndex!==null?'Choose exercise to add below selected exercise':'Choose exercise to add to workout'}</Text><Input placeholder="Search exercise, muscle or equipment" value={exerciseQuery} onChangeText={setExerciseQuery}/><View style={styles.choiceRow}>{['all','chest','back','shoulders','arms','legs','core','conditioning'].map(m=><Button key={m} secondary label={m} onPress={()=>setMuscleFilter(m)}/>)}</View>{exerciseDatabase.map(item=><View key={item.name} style={styles.food}><Text style={styles.exerciseName}>{item.name}</Text><Text style={styles.muted}>{item.day} • {item.muscle} • {item.load} • {item.equipment.join(', ')}{item.alt ? ` • Swap idea: ${item.alt}` : ''}</Text><View style={styles.choiceRow}>{swapIndex!==null?<Button secondary label="Use as Swap" onPress={()=>swapDraftExercise(swapIndex,item)}/>:<Button secondary label={insertIndex!==null?'Add Here':'Add'} onPress={()=>addExerciseToDraft(item)}/>}</View></View>)}</Card>}<Card title="Workout History">{state.workouts.slice(-10).reverse().map(w=><TouchableOpacity key={w.id} style={styles.history} onPress={()=>setSelectedWorkout(w)}><Text style={styles.text}>{w.date} • {w.day}</Text><Text style={styles.muted}>{w.volume}kg • {w.exercises.length} exercises</Text></TouchableOpacity>)}</Card>{selectedWorkout&&<Card title={`${selectedWorkout.day} Details`} badge={selectedWorkout.date}>{selectedWorkout.exercises.map(item=><View key={item.name} style={styles.food}><Text style={styles.exerciseName}>{item.name}</Text><Text style={styles.muted}>{item.setsDone.map((s,i)=>`S${i+1}: ${s.kg}kg x ${s.reps}`).join('   ')}</Text></View>)}</Card>}</View>}
    {state.tab==='Food'&&<View><Card title="Today’s Nutrition"><Text style={styles.hero}>{totals.calories} kcal</Text><Text style={styles.text}>Protein {totals.protein}g • Carbs {totals.carbs}g • Fat {totals.fat}g</Text></Card><Card title="Search + Barcode"><Input placeholder="Search chicken, rice, Morrisons..." value={query} onChangeText={setQuery}/><Button label={loading?'Searching...':'Search foods'} onPress={foodSearch}/><Input placeholder="Barcode number" value={barcode} onChangeText={setBarcode} keyboardType="numeric"/><Button secondary label="Scan with camera" onPress={openScanner}/><Button secondary label="Find barcode" onPress={()=>barcodeSearch()}/>{results.map(f=><Food key={f.id} food={f} onPress={()=>{setSelected(f);setPortion(String(f.servingG||100));}}/>)}{selected&&<View style={styles.panel}><Text style={styles.exerciseName}>{selected.name}</Text><Input placeholder="Portion grams/ml" value={portion} onChangeText={setPortion} keyboardType="decimal-pad"/><Button label="Add to today" onPress={()=>addFood()}/></View>}</Card><Card title="Quick Foods">{state.favourites.slice(0,12).map(f=><Food key={f.id} food={f} onPress={()=>{setSelected(f);setPortion(String(f.servingG||100));}}/>)}</Card><Card title="Today’s Foods">{mealsToday.map(m=><TouchableOpacity key={m.id} style={styles.food} onPress={()=>removeMeal(m.id)}><Text style={styles.text}>{m.name} • {m.calories} kcal</Text><Text style={styles.muted}>{m.protein}P {m.carbs}C {m.fat}F • tap to remove</Text></TouchableOpacity>)}<Input placeholder="Meal name to save" value={mealName} onChangeText={setMealName}/><Button secondary label="Save today as favourite meal" onPress={saveMealTemplate}/>{state.savedMeals.map(m=><Button key={m.id} secondary label={`Log meal: ${m.name}`} onPress={()=>logSavedMeal(m)}/>)}</Card><Card title="Create Custom Food"><Input placeholder="Name" value={customFood.name} onChangeText={v=>setCustomFood({...customFood,name:v})}/><View style={styles.row}><Input small placeholder="g/ml" value={customFood.servingG} onChangeText={v=>setCustomFood({...customFood,servingG:v})}/><Input small placeholder="kcal" value={customFood.calories} onChangeText={v=>setCustomFood({...customFood,calories:v})}/><Input small placeholder="protein" value={customFood.protein} onChangeText={v=>setCustomFood({...customFood,protein:v})}/></View><View style={styles.row}><Input small placeholder="carbs" value={customFood.carbs} onChangeText={v=>setCustomFood({...customFood,carbs:v})}/><Input small placeholder="fat" value={customFood.fat} onChangeText={v=>setCustomFood({...customFood,fat:v})}/></View><Button label="Save custom food" onPress={saveCustomFood}/></Card></View>}
    {state.tab==='Progress'&&<View><Card title="Body Progress"><View style={styles.row}><Input small placeholder="kg" value={progress.weight} onChangeText={v=>setProgress({...progress,weight:v})}/><Input small placeholder="waist" value={progress.waist} onChangeText={v=>setProgress({...progress,waist:v})}/><Input small placeholder="chest" value={progress.chest} onChangeText={v=>setProgress({...progress,chest:v})}/></View><View style={styles.row}><Input small placeholder="arms" value={progress.arms} onChangeText={v=>setProgress({...progress,arms:v})}/><Input small placeholder="thighs" value={progress.thighs} onChangeText={v=>setProgress({...progress,thighs:v})}/></View><Button label="Add check-in" onPress={addProgress}/>{state.progress.slice(-8).reverse().map(p=><Text key={p.id} style={styles.text}>{p.date}: {p.weight}kg, waist {p.waist}cm</Text>)}</Card><Card title="Targets"><View style={styles.choiceRow}>{goals.map(g=><TouchableOpacity key={g.key} style={[styles.choice,target.goal===g.key&&styles.choiceOn]} onPress={()=>calculateTargets(g.key)}><Text style={styles.choiceText}>{g.emoji} {g.key}</Text></TouchableOpacity>)}</View><Input placeholder="Weight kg" value={String(target.weight)} onChangeText={v=>setTarget({...target,weight:v})}/><Button secondary label="Calculate from goal" onPress={()=>calculateTargets(target.goal,toNum(target.weight))}/><View style={styles.row}><Input small placeholder="kcal" value={String(target.calories)} onChangeText={v=>setTarget({...target,calories:v})}/><Input small placeholder="protein" value={String(target.protein)} onChangeText={v=>setTarget({...target,protein:v})}/><Input small placeholder="carbs" value={String(target.carbs)} onChangeText={v=>setTarget({...target,carbs:v})}/><Input small placeholder="fat" value={String(target.fat)} onChangeText={v=>setTarget({...target,fat:v})}/></View><Button label="Save targets" onPress={saveTargets}/><Button secondary label="Auto-adjust calories from weigh-ins" onPress={autoCalories}/></Card></View>}
    {state.tab==='Settings'&&<View><Card title="Equipment Manager">{state.equipment.map(item=><TouchableOpacity key={item.id} style={[styles.choice,item.enabled&&styles.choiceOn]} onPress={()=>toggleEq(item.id)}><Text style={styles.choiceText}>{item.enabled?'✓':'○'} {item.name} {item.maxKg?`• ${item.maxKg}kg`:''}</Text></TouchableOpacity>)}<Input placeholder="New equipment" value={equipDraft.name} onChangeText={v=>setEquipDraft({...equipDraft,name:v})}/><Input placeholder="Max kg" value={equipDraft.maxKg} onChangeText={v=>setEquipDraft({...equipDraft,maxKg:v})} keyboardType="decimal-pad"/><Button label="Add equipment" onPress={addEq}/></Card><Card title="Add Exercise"><Input placeholder="Exercise name" value={exDraft.name} onChangeText={v=>setExDraft({...exDraft,name:v})}/><View style={styles.choiceRow}>{['Push','Pull','Legs'].map(d=><Button key={d} secondary label={d} onPress={()=>setExDraft({...exDraft,day:d})}/>)}</View><Input placeholder="Muscle e.g. chest, back, legs" value={exDraft.muscle} onChangeText={v=>setExDraft({...exDraft,muscle:v})}/><Input placeholder="Equipment comma list" value={exDraft.equipment} onChangeText={v=>setExDraft({...exDraft,equipment:v})}/><View style={styles.row}><Input small placeholder="sets" value={exDraft.sets} onChangeText={v=>setExDraft({...exDraft,sets:v})}/><Input small placeholder="reps" value={exDraft.reps} onChangeText={v=>setExDraft({...exDraft,reps:v})}/><Input small placeholder="kg" value={exDraft.defaultKg} onChangeText={v=>setExDraft({...exDraft,defaultKg:v})}/></View><Button label="Save exercise" onPress={addExercise}/></Card><Card title="Backup / Restore"><Button secondary label="Create backup text" onPress={backup}/><Input multiline placeholder="Backup text" value={backupInput||state.backupText} onChangeText={setBackupInput}/><Button label="Restore backup" onPress={restore}/><Button danger label="Reset app" onPress={()=>Alert.alert('Reset app','Delete all local data?',[{text:'Cancel'},{text:'Reset',style:'destructive',onPress:()=>setState(defaultState)}])}/></Card></View>}
  </ScrollView><Tabs tab={state.tab} setTab={t=>patch({tab:t})}/></KeyboardAvoidingView></SafeAreaView>;
}

function Button({label,onPress,secondary,danger}){return <TouchableOpacity onPress={onPress} style={[styles.button,secondary&&styles.secondary,danger&&styles.danger]}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>}
function Input(p){return <TextInput {...p} placeholderTextColor="#75819a" style={[styles.input,p.small&&styles.smallInput,p.multiline&&{height:120,textAlignVertical:'top'}]}/>}
function Card({title,badge,children}){return <View style={styles.card}><View style={styles.cardHead}><Text style={styles.cardTitle}>{title}</Text>{badge?<Text style={styles.badge}>{badge}</Text>:null}</View>{children}</View>}
function Bar({value,max}){return <View style={styles.track}><View style={[styles.fill,{width:`${Math.min(100,(toNum(value)/Math.max(1,toNum(max)))*100)}%`}]}/></View>}
function Stat({label,value}){return <View style={styles.stat}><Text style={styles.heroSmall}>{value}</Text><Text style={styles.muted}>{label}</Text></View>}
function Food({food,onPress}){return <TouchableOpacity style={styles.food} onPress={onPress}><Text style={styles.text}>{food.name}</Text><Text style={styles.muted}>{food.brand||food.source} • per 100g: {food.calories} kcal • P {food.protein} C {food.carbs} F {food.fat}</Text></TouchableOpacity>}
function Tabs({tab,setTab}){const tabs=[['Dashboard','🏠'],['Train','🏋️'],['Food','🍽️'],['Progress','📈'],['Settings','⚙️']];return <View style={styles.tabs}>{tabs.map(([t,i])=><TouchableOpacity key={t} style={styles.tab} onPress={()=>setTab(t)}><Text style={[styles.tabIcon,tab===t&&styles.on]}>{i}</Text><Text style={[styles.tabLabel,tab===t&&styles.on]}>{t}</Text></TouchableOpacity>)}</View>}

function mapFood(p){const n=p?.nutriments||{}; const name=p?.product_name||p?.generic_name; if(!name)return null; return {id:String(p.code||uid('off')),name,brand:p.brands||'Open Food Facts',servingG:toNum(p.serving_quantity)||100,calories:round1(n['energy-kcal_100g']||n['energy-kcal']||0),protein:round1(n.proteins_100g||0),carbs:round1(n.carbohydrates_100g||0),fat:round1(n.fat_100g||0),source:'Open Food Facts'};}
function macroTotals(rows){return rows.reduce((a,m)=>({calories:round1(a.calories+toNum(m.calories)),protein:round1(a.protein+toNum(m.protein)),carbs:round1(a.carbs+toNum(m.carbs)),fat:round1(a.fat+toNum(m.fat))}),{calories:0,protein:0,carbs:0,fat:0});}
function sum(a){return a.reduce((x,y)=>x+toNum(y),0)}
function workoutVolume(exs){return Math.round(exs.reduce((a,item)=>a+sum((item.setsDone||[]).map(s=>toNum(s.kg)*toNum(s.reps))),0));}
function suggestKg(item,workouts){const sets=workouts.flatMap(w=>w.exercises||[]).filter(e=>e.name===item.name).flatMap(e=>e.setsDone||[]); if(!sets.length)return item.defaultKg; const best=sets.reduce((b,s)=>toNum(s.kg)>toNum(b.kg)?s:b,sets[0]); const hitTop=toNum(best.reps)>=toNum(item.targetReps); const step=item.equipment.includes('Barbell')||item.equipment.includes('Tricep Bar')||item.equipment.includes('5ft Standard Barbell')?2.5:1; return round1(toNum(best.kg)+(hitTop?step:0));}
function getPRs(workouts){const prs={}; workouts.forEach(w=>(w.exercises||[]).forEach(item=>(item.setsDone||[]).forEach(s=>{const score=toNum(s.kg)*Math.max(1,toNum(s.reps)); if(!prs[item.name]||score>prs[item.name].score)prs[item.name]={kg:toNum(s.kg),reps:toNum(s.reps),score};}))); return prs;}
function volumeLast7(workouts){const min=new Date(); min.setDate(min.getDate()-7); return workouts.filter(w=>new Date(w.date)>=min).reduce((a,w)=>a+toNum(w.volume),0);}
function getWeek(s){const min=new Date(); min.setDate(min.getDate()-7); const meals=s.meals.filter(m=>new Date(m.date)>=min); const workouts=s.workouts.filter(w=>new Date(w.date)>=min); const progress=s.progress.filter(p=>p.weight); const mt=macroTotals(meals); const days=new Set(meals.map(m=>m.date)).size||1; const wc=progress.length>1?round1(progress[progress.length-1].weight-progress[0].weight):0; return {workouts:workouts.length,avgCalories:Math.round(mt.calories/days),avgProtein:Math.round(mt.protein/days),weightChange:wc};}
function getStreak(s){let count=0; for(let i=0;i<30;i++){const d=new Date(); d.setDate(d.getDate()-i); const k=d.toISOString().slice(0,10); if(s.workouts.some(w=>w.date===k)||s.meals.some(m=>m.date===k))count++; else break;} return count;}
function getCoach(s,totals,week){const notes=[]; if(totals.protein<s.profile.protein*0.7)notes.push('Protein is low today: add chicken, tuna, eggs or a lactose-free shake.'); if(totals.calories>s.profile.calories+250)notes.push('Calories are running high: keep the next meal lean and simple.'); if(week.workouts<3)notes.push('Aim for 3 Push/Pull/Legs sessions this week.'); if(volumeLast7(s.workouts)>0)notes.push('Progression: add reps first, then add small weight jumps when top reps are hit.'); if(s.progress.length>=2)notes.push('Use auto calorie adjustment weekly, not daily, so weight trends are fair.'); return notes.join(' ')||'Log food, water, weigh-ins and workouts to unlock sharper coaching.';}
function format(s){const m=Math.floor(s/60); return `${m}:${String(s%60).padStart(2,'0')}`;}

const styles={app:{flex:1,backgroundColor:'#07101f'},header:{padding:18,paddingTop:12,borderBottomWidth:1,borderColor:'#1e2a44'},title:{color:'#fff',fontSize:28,fontWeight:'900'},subtitle:{color:'#9fb0cf',fontWeight:'700'},body:{padding:14,paddingBottom:115},card:{backgroundColor:'#101a2d',borderRadius:22,padding:16,marginBottom:14,borderWidth:1,borderColor:'#243556'},cardHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10},cardTitle:{color:'#fff',fontSize:18,fontWeight:'900'},badge:{color:'#dbe6ff',backgroundColor:'#243a68',paddingHorizontal:10,paddingVertical:5,borderRadius:99,fontWeight:'900'},hero:{color:'#fff',fontSize:26,fontWeight:'900'},heroSmall:{color:'#fff',fontSize:18,fontWeight:'900'},text:{color:'#e7eefc',fontSize:15,fontWeight:'700',marginVertical:2},muted:{color:'#9aa9c4',fontSize:12,fontWeight:'700'},input:{backgroundColor:'#07101f',color:'#fff',borderWidth:1,borderColor:'#31466d',borderRadius:14,padding:12,marginVertical:6,fontWeight:'800'},smallInput:{width:72,textAlign:'center'},button:{backgroundColor:'#4b6bff',padding:12,borderRadius:16,alignItems:'center',marginVertical:5},secondary:{backgroundColor:'#24324f'},danger:{backgroundColor:'#7d2634'},buttonText:{color:'#fff',fontWeight:'900'},track:{height:10,backgroundColor:'#26334d',borderRadius:99,overflow:'hidden',marginVertical:10},fill:{height:'100%',backgroundColor:'#57d6a3'},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},stat:{width:'47%',backgroundColor:'#07101f',borderRadius:16,padding:12,borderWidth:1,borderColor:'#263859'},row:{flexDirection:'row',alignItems:'center',gap:7,flexWrap:'wrap'},choiceRow:{flexDirection:'row',gap:8,flexWrap:'wrap'},choice:{padding:12,borderRadius:16,backgroundColor:'#07101f',borderWidth:1,borderColor:'#31466d',marginVertical:4},choiceOn:{backgroundColor:'#243a68',borderColor:'#5f7fff'},choiceText:{color:'#fff',fontWeight:'900'},exercise:{borderTopWidth:1,borderColor:'#263859',paddingTop:10,marginTop:8},exerciseName:{color:'#fff',fontSize:16,fontWeight:'900'},setLabel:{color:'#cbd7ed',fontWeight:'900',width:48},food:{backgroundColor:'#07101f',borderRadius:16,padding:12,marginVertical:5,borderWidth:1,borderColor:'#263859'},panel:{backgroundColor:'#16243c',borderRadius:18,padding:12,marginVertical:8},history:{backgroundColor:'#07101f',borderRadius:16,padding:12,marginVertical:5,borderWidth:1,borderColor:'#263859'},tabs:{position:'absolute',left:10,right:10,bottom:10,backgroundColor:'#111a2b',borderRadius:24,borderWidth:1,borderColor:'#2b3b5d',paddingVertical:8,flexDirection:'row'},tab:{alignItems:'center',flex:1},tabIcon:{fontSize:18,opacity:.55},tabLabel:{color:'#8d9bb5',fontSize:10,fontWeight:'900'},on:{color:'#fff',opacity:1},camera:{flex:1},cameraOverlay:{position:'absolute',left:16,right:16,bottom:28,backgroundColor:'rgba(7,16,31,.92)',borderRadius:22,padding:18,borderWidth:1,borderColor:'#3a4d70'}};
