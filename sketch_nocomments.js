let currentStatus = 0 // 0 = menu, 1 = select A, 2 = select B, 3 = play, 4 = game over, 5 = rankInfo
let gameScreen = 0
let gameMode = 0 // 1 to 6
let gameModeName = ""
let subGameModeName = ""
let subGameMode = 0 // 1 to 3
let gameDuration = 60 // 60 default, can do 30/60/90/120


// let countdown = 0
let threeSecondCountdown = 4
let lastMillisecond = 0

let countdowns = {
  "ThreeSecondCountdown": {lastMillisecond: 0, delay: 1000, value: 4, done: false},
  "GameplayCountdown": {lastMillisecond: 0, delay: 1000, value: 61, done: true},
  "ChallengeStopwatch": {lastMillisecond: 0, delay: 1000, value: 0, done: false}

} // object with lastMillisecond, delay, value

let gameRunning = false
let gameInProgress = false

let menuItemsPositions
let trainingModeOptions
let timeOptions
let options

let gameObjects = {
  circleTargets: [
    {
    x: -500, y: -500, r: 0, color: 0, xSpeed: 0, ySpeed: 0,
    health: 0, xSizeSF: 0, ySizeSF: 0,
    despawnTime: 1, halfwayThrough: false, dirProb: 102
  },
    {
    x: -500, y: -500, r: 0, color: 0, xSpeed: 0, ySpeed: 0,
    health: 0, xSizeSF: 0, ySizeSF: 0,
    despawnTime: 1, halfwayThrough: false, dirProb: 102
  },
],
  rectTargets: [
    {
    x: -500, y: -500, r: 0, color: 0, xSpeed: 0, ySpeed: 0,
    health: 0, xSizeSF: 0, ySizeSF: 0,
    despawnTime: 1, halfwayThrough: false, dirProb: 102
  },
    {
    x: -500, y: -500, r: 0, color: 0, xSpeed: 0, ySpeed: 0,
    health: 0, xSizeSF: 0, ySizeSF: 0,
    despawnTime: 1, halfwayThrough: false, dirProb: 102
  },
],
  humanoids: [
    {
    x: -500, y: -500, r: 0, color: 0, xSpeed: 0, ySpeed: 0,
    health: 0, xSizeSF: 0, ySizeSF: 0,
    despawnTime: 1, halfwayThrough: false, dirProb: 102
  },
    {
    x: -500, y: -500, r: 0, color: 0, xSpeed: 0, ySpeed: 0,
    health: 0, xSizeSF: 0, ySizeSF: 0,
    despawnTime: 1, halfwayThrough: false, dirProb: 102
  },
],
  
  
}

let gameStats = {
  kills: 0, // number of targets defeated
  hits: 0,
  // just calculate kills per second
  clicks: 0, // total number of mouse clicks
  secondsPassed: -1,
  diffMod: 0, // difficulty modifier -- adaptive only
  performance: 0, // postive = harder, negative = easier -- adaptive only
  threshold: 0, // 0 to 1, once 1, reset and increment performance
  hitTarget: false,
  adaptive: false,
  showHealth: false,
  rankAchieved: "Bronze", // update this once game completed
  performanceValue: 0, // update this once game completed


  stillTarget: true, // sniping_fast only
  movingTargetRight: true, // sniping_fast only
  lives: 10000, // challenge mode only
  speed: 0, // challenge mode only
  lastSecond: -2, // challenge mode only
  challengeLastMS: 0, // challenge mode only
  nextSpawnTime: 0,
}

let performanceBenchmarks = null

let conversionFunctions = {
  ["Accuracy_Stationary"]: [function() 
    {x = gameStats.kps; return (2*x)*0.75},

    function() {x = gameStats.accPct; return (-0.0806 + 0.0584*x + 0.000399*x**2)*0.25}],
    
  ["Accuracy_Moving"]: [function()
    {x = gameStats.kps; return (-0.201 + 0.792*x + 0.633*x**2)*0.6},
    function() {x = gameStats.accPct; return (-1.07 + 0.0798*x + 0.00116*x**2)*0.4}
  ],

  ["Tracking_Kills"]: [function() {
    x = gameStats.diffMod; return (5*x+4)*0.5},
    function() {x = gameStats.accPct; return (1.24*Math.E**(0.0532*x))*0.5}
  ],

  ["Tracking_One Target"]: [function()
    {x = gameStats.accPct; return (0.108 + 0.0235*x + 0.00108*x**2)}],

  ["Sniping_Fast"]: [function() {x = gameStats.diffMod; return (5 + 1.71*x + 0.189*x**3)*0.5},
  function() {x = gameStats.kps; return (6.48*x + 0.227)*0.5}
  ],
 
  ["Sniping_Shrinking"]: [function()
    {x = gameStats.diffMod; return (5.81 + 2.54*x + 0.0603*x**2 - 0.0053*x**3)*0.6},
    function() {x = gameStats.accPct; return (0.26 + 0.0532*x + 0.001*x**2)*0.4}
  ],

  ["Sniping_Dummies"]: [function()
    {x = gameStats.kps; return (5.31*x + 0.61)*0.75},
    function() {x = gameStats.accPct; return (-1.48 + 0.0759*x + 0.00028*x**2)*0.25}
  ],

  ["Tile Frenzy_Normal"]: [function()
    {x = gameStats.kps; return (2*x - 3)*0.8},
    function() {x = gameStats.accPct; return (0.243 - 0.00177*x + 0.00108*x**2)*0.2}
  ],

  ["Tile Frenzy_Micro"]: [function()
    {x = gameStats.kps; return (1.9*x - 0.62)*0.8},
    function() {x = gameStats.accPct; return (0.243 - 0.00177*x + 0.00108*x**2)*0.2}
  ],

  ["Challenge_Regular"]: [function()
    {x = gameStats.secondsPassed; return (-2.75 + 0.0504*x - 9.46e-5*x**2 + 1.68e-7*x**3)}
  ]
}

let gamemodeFunctions = {
  "Accuracy": {
    "Stationary": function() {


      if (gameObjects.circleTargets.length < 5) {

        let x = random(width/10, 9*width/10)
        let y = random(2*height/10, 8*height/10)
        let r = 20
        spawnCircle(x, y, r, 255, 0, 0, 0, 100, 1, 1, 100000, false, 999999)
      }
    },

    "Moving": function() {
      // VARIABLE difficulty
      gameStats.adaptive = true
      if (gameObjects.circleTargets.length < 5) {
        // If fewer than 5 targets in array, generate
        let x = random(width/10, 9*width/10)
        let y = random(2*height/10, 8*height/10)
        let r = 25

        // TODO: UPDATE THIS TO ADAPT TO PERFORMANCE
        let xSpeed = random(-5, 5)
        let ySpeed = random(-5, 5)

        // let xSpeed = 0.5
        // let ySpeed = 0.5

        xSpeed = (Math.abs(xSpeed)>=0.25) ? xSpeed : random(1, 3)
        ySpeed = (Math.abs(ySpeed)>=0.25) ? ySpeed : random(1, 3)

        xSpeed = max(0.25, xSpeed += gameStats.diffMod)
        ySpeed = max(0.25, ySpeed += gameStats.diffMod)


        let xSizeSF = 2
        let ySizeSF = 2
        let lifeDuration = 20000
        spawnCircle(x, y, r, 255, 0, xSpeed, ySpeed, 100, xSizeSF, ySizeSF, lifeDuration+millis(), false, 999)
      } else {
      //   for (let i = 0; i < gameObjects.circleTargets.length; i++) {
      //     let target = gameObjects.circleTargets[i]

      //     // update speeds
      //     target.xSpeed = max(0.25, target.xSpeed += gameStats.diffMod)
      //     target.ySpeed = max(0.25, target.ySpeed += gameStats.diffMod)
      //   }
      }
    }
  },

  "Tracking": {
    "Kills": function() {
      gameStats.adaptive = true
      gameStats.showHealth = true
      if (gameObjects.circleTargets.length < 5) {

        let x = random(width/10, 9*width/10)
        let y = random(2*width/10, 8*height/10)
        let r = 50

        let xSpeed = 3
        let ySpeed = 3

        xSpeed = max(1.5, xSpeed += gameStats.diffMod)
        ySpeed = max(1.5, ySpeed += gameStats.diffMod)

        spawnCircle(x, y, r, color(0, 255, 0), 0, xSpeed, ySpeed, 180, 1, 1, 0, false, 98.5)
      } else {

        gameStats.clicks++
        let circleTargets = gameObjects.circleTargets
        let circleObj = null

        for (let i = 0; i < circleTargets.length; i++) {
          let critHit = false
          circleObj = circleTargets[i]
          if (clickedCircle(circleObj.x, circleObj.y, 10)) {critHit = true}
          if (clickedCircle(circleObj.x, circleObj.y, circleObj.r)) {
            gameStats.hits++
            circleObj.health--
            if (critHit) {circleObj.health -= 9}
            gameStats.diffMod += 0.001


            let pct = circleObj.health / 180

            let red = null
            let green = null



            let completed = 1 - pct
            if (completed <= 0.5) {
              green = 255
              red = 255 * completed*2
            } else if (completed > 0.5 && completed < 1) {
              green = 255 * (1-completed)*2
              red = 255
            }

            circleObj.color = color(red, green, 0)

            if (circleObj.health <= 0) {
              gameStats.kills++
              gameStats.diffMod += 0.5
              circleTargets.splice(i, 1)
              break
            }
          }
        }

        
      }
    },

    "One Target": function() {
      // check mouse hovering
      if (gameObjects.circleTargets.length < 1) {
        let x = width/2
        let y = height/2
        let r = 125

        let xSpeed = 5
        let ySpeed = 5

        spawnCircle(x, y, r, color(255, 0, 0), 0, xSpeed, ySpeed, 100, 1, 1, 10000000000, false, 98)
      } else {
        // check mouse hovering
        gameStats.clicks++
        let circleObj = gameObjects.circleTargets[0]

        let maxSpeed = max(circleObj.xSpeed, circleObj.ySpeed)
        let newDist = circleObj.r + (maxSpeed)*2

        if (clickedCircle(circleObj.x, circleObj.y, newDist)) {
          circleObj.color = color(0, 255, 0)
          gameStats.hits++
        } else {
          circleObj.color = color(255, 0, 0)
        }
      }
    }
  },

  "Sniping": {
    "Fast": function() {
      // alternate between still target and moving target
      // adaptive
      gameStats.adaptive = true
      if (gameObjects.circleTargets.length < 1) {
        if (gameStats.stillTarget) {
          spawnCircle(width/2, height/2, 50, 255, 0, 0, 0, 100, 1, 1, 4000+millis(), 1, 98.5)
        } else {
          // create a moving target
          let x = random(width/10, 9*width/10)
          let y = random(2*height/10, 8*height/10)
          let r = 50

          // TODO: UPDATE THIS TO ADAPT TO PERFORMANCE
          let xSpeed = 2
          let ySpeed = 2
          let disappearTime = (5 - gameStats.diffMod/2)*1000

          xSpeed = max(1, xSpeed += gameStats.diffMod)
          ySpeed = max(1, ySpeed += gameStats.diffMod)

          xSpeed = (xSpeed > 0) ?
        max(1, xSpeed + gameStats.diffMod) : min(-1, xSpeed - gameStats.diffMod)

          ySpeed = (ySpeed > 0) ?
        max(1, ySpeed + gameStats.diffMod) : min(-1, ySpeed - gameStats.diffMod)

          spawnCircle(x, y, r, 255, 0, xSpeed, ySpeed, 100, 1, 1, disappearTime+millis(), false, 98.5)
        }
        // after spawning circle, flip
        gameStats.stillTarget = !gameStats.stillTarget
      }
    },

    "Shrinking": function() {
      let disappearTime = 4000 - (gameStats.diffMod/2)*1000
      gameStats.adaptive = true
      if (gameObjects.circleTargets.length < 1) {
        // grow then shrink
        let x = random(width/10, 9*width/10)
        let y = random(2*height/10, 8*height/10)
        let r = 20

        // TODO: UPDATE THIS TO ADAPT TO PERFORMANCE
        let xSpeed = 5
        let ySpeed = 5

        xSpeed = max(1, xSpeed += gameStats.diffMod)
        ySpeed = max(1, ySpeed += gameStats.diffMod)
        // disappearTime = 4000

        let xSizeSF = 1.005
        let ySizeSF = 1.005

        spawnCircle(x, y, r, 255, 0, xSpeed, ySpeed, 100, xSizeSF, ySizeSF, millis()+disappearTime, false, 98.5)
      } else {
        // update
        let target = gameObjects.circleTargets[0]

        // first half
        if (target.despawnTime - millis() >= disappearTime/2) {
          // grow
          target.r *= target.xSizeSF
          target.r *= target.ySizeSF
        } else {
          target.r /= target.xSizeSF
          target.r /= target.ySizeSF
        }

        if (target.despawnTime - millis() < 0) {
          gameObjects.circleTargets.pop()
          gameStats.diffMod -= 0.5
        }
      }
    },

    "Dummies": function() {
      if (gameObjects.humanoids.length < 5) {
        gameStats.showHealth = true
        // if fewer than 5 humanoids, generate a new one

        // same x-value, y will vary
        // 25 radius for circle?

        // spawn rectangle below circle

        // 75 width, 150 height

        let circleX = random(width/10, 9*width/10)
        let circleY = random(3*height/10, 7*height/10)

        let rectW = 40
        let rectH = 80

        let rectX = circleX // same x-value since centered
        let rectY = circleY + (rectH/2) + 10

        let xSpeed = random(-5, 5)
        let ySpeed = random(-5, 5)

        // xSpeed = 2
        // ySpeed = 0

        xSpeed = (Math.abs(xSpeed)>=1) ? xSpeed : random(1, 5)
        ySpeed = (Math.abs(ySpeed)>=1) ? ySpeed : random(1, 5)

        spawnHumanoid(circleX, circleY, 20, rectX, rectY, rectW, rectH, xSpeed, ySpeed, 300)
      }
    }
  },

  "Tile Frenzy": {
    "Normal": function() {
      if (gameObjects.rectTargets.length < 3) {
        let x = random(width/10, 9*width/10)
        let y = random(2*height/10, 8*height/10)
        let s = 100

        spawnRectangle(x, y, s, s, 255, 0, 0, 0, 100)
      }
    },

    "Micro": function() {
      if (gameObjects.rectTargets.length < 5) {
        let x = random(width/10, 9*width/10)
        let y = random(2*height/10, 8*height/10)
        let s = 100/3

        spawnRectangle(x, y, s, s, 255, 0, 0, 0, 100)
      }
    },
  },

  "Challenge": {
    "Regular": function() {
      // function f(x) = 0.749(x+2)^0.33
      let speed = 0.749 * (gameStats.secondsPassed)**0.33
      gameStats.speed = speed
      let delayBtwnSpawn = 1/speed
      let currentTime = millis()

      

      // if (gameStats.lastSecond < gameStats.secondsPassed) {
        if (currentTime - gameStats.nextSpawnTime > delayBtwnSpawn*1000) {
          // spawn a target
          let x = random(width/10, 9*width/10)
          let y = random(2*height/10, 8*height/10)
          let r = 30

          let xSizeSF = 1.008
          let ySizeSF = 1.008

          spawnCircle(x, y, r, 255, 0, 0, 0, 100, xSizeSF, ySizeSF, 99999, false)
          gameStats.nextSpawnTime = currentTime + delayBtwnSpawn*1000
          
        }
      //   gameStats.lastSecond = gameStats.secondsPassed
      // }


      // console.log(currentTime - countdowns.GameplayCountdown.lastMillisecond)
      // if (countdowns.GameplayCountdown.lastMillisecond - millis() > 1000) {
      //   // decrement
      //   console.log("test run every second")
      // }

      
      
      

      for (let i = 0; i < gameObjects.circleTargets.length; i++) {
        let target = gameObjects.circleTargets[i]
        if (target.r < 75 && !target.halfwayThrough) {
          // grow
          target.r *= target.xSizeSF
          target.r *= target.ySizeSF

        } else {
          target.halfwayThrough = true   
        }

        if (target.halfwayThrough) {
          target.r *= (1/target.xSizeSF)
          target.r *= (1/target.ySizeSF)
        }

        if (target.r < 1) {
          gameObjects.circleTargets.splice(i, 1)
          gameStats.lives--
        }

        if (gameStats.lives <= 0) {
          countdowns.GameplayCountdown.value -= 99999
        }
      }
    }
  }
}

function preload() {
  
}

function setup() {
  createCanvas(1280, 720);

  menuItemsPositions = {
    "Accuracy": [2*width/8, 2*height/8],
    "Tracking": [2*width/8, 4*height/8],
    "Sniping": [2*width/8, 6*height/8],
    "Tile Frenzy": [6*width/8, 2*height/8],
    "Challenge": [6*width/8, 4*height/8],
    // "Fun": [6*width/8, 6*height/8],
  },

  timeOptions = {
    "30": [2*width/10, 3*height/10, color(0, 0, 200)],
    "60": [4*width/10, 3*height/10, color(200, 0, 0)],
    "90": [6*width/10, 3*height/10, color(0, 0, 200)],
    "120": [8*width/10, 3*height/10, color(0, 0, 200)],
  },

  trainingModeOptions = {
    "Accuracy": {
      "Stationary": [width/2, 6*height/12],
      "Moving": [width/2, 8*height/12],
    },
    "Tracking": {
      "Kills": [width/2, 6*height/12],
      "One Target": [width/2, 8*height/12],
    },
    "Sniping": {
      "Fast": [width/2, 6*height/12],
      "Shrinking": [width/2, 8*height/12],
      "Dummies": [width/2, 10*height/12],
    },
    "Tile Frenzy": {
      "Normal": [width/2, 6*height/12],
      "Micro": [width/2, 8*height/12],
    },
    "Challenge": {
      "Regular": [width/2, 6*height/12],
    },
    // "Fun": {
    //   "CPS Test": [width/2, 6*height/12],
    //   "Reaction Time": [width/2, 8*height/12],
    // },
  }
}




function draw() {
  

  if (currentStatus == 0) {
    // welcome screen
    gameObjects.circleTargets = []
    gameObjects.rectTargets = []
    gameObjects.humanoids = []

    welcomeScreen()
    cursor(CROSS)
  } else if (currentStatus == 1) {
    // menu screen
    selectGameMode()
    cursor(CROSS)
  } else if (currentStatus == 2) {
    trainingOptions()
    cursor(CROSS)
  } else if (currentStatus == 3) {
    
    if (/*gameModeName != "Challenge" &&*/ gameModeName != "Fun") {
      gameplay()
      cursor(CROSS)
    }
  } else if (currentStatus == 4) {
    gameOver()
    cursor(CROSS)
  }
}

// *****GAME SCREENS*****

// welcome screen
function welcomeScreen() {
  background(0)

  // text
  fill(255)
  textSize(100)
  textAlign(CENTER, CENTER)
  text("AimClinic", width/2, height/4)

  fill(200)
  textSize(50)
  text("2D Aim Trainer", width/2, height/3)
  // rectMode(CORNER)

  // draw the menu button
  fill(color(0,127,0))
  rectMode(CENTER, CENTER)
  rect(width/2, 3*height/4, 300, 75)

  fill(0)
  textSize(50)
  text("PLAY", width/2, 3*height/4)
}




// select game mode screen
function selectGameMode() {
  background(0)

  // title text
  fill(255)
  textSize(75)
  textAlign(CENTER, CENTER)
  text("Select Game Mode", width/2, height/10)

  // escape text
  fill(255)
  textSize(25)
  textAlign(LEFT, TOP)
  text("[ESC] to return to main menu", 0, 0)

  // BUTTONS -- ABSTRACT THIS???
  drawRectButtons(color(200, 0, 0), 2*width/8, 2*height/8, 400, 100, 255, 50, "Accuracy", 2*width/8, 2*height/8)
  drawRectButtons(color(0, 200, 0), 2*width/8, 4*height/8, 400, 100, 255, 50, "Tracking", 2*width/8, 4*height/8)
  drawRectButtons(color(0, 0, 200), 2*width/8, 6*height/8, 400, 100, 255, 50, "Sniping", 2*width/8, 6*height/8)

  drawRectButtons(color(255, 127, 0), 6*width/8, 2*height/8, 400, 100, 255, 50, "Tile Frenzy", 6*width/8, 2*height/8)
  drawRectButtons(color(142, 0, 246), 6*width/8, 4*height/8, 400, 100, 255, 50, "Challenge", 6*width/8, 4*height/8)
  // drawRectButtons(color(0, 0, 200), 6*width/8, 6*height/8, 400, 100, 255, 50, "Fun", 6*width/8, 6*height/8)
  
}

// training options
function trainingOptions() {
  background(0)

  // title text
  fill(255)
  textSize(75)
  textAlign(CENTER, CENTER)
  text("Training Options: "+gameModeName, width/2, height/10)

  // escape text
  fill(255)
  textSize(25)
  textAlign(LEFT, TOP)
  text("[ESC] to go back", 0, 0)


  // time selection
  // instructions
  let instructionsText = "Select game mode"

  if (gameModeName != "Challenge" && gameModeName != "Fun") {
    instructionsText = "Select game time and game mode"
    noStroke()
    drawRectButtons(timeOptions["30"][2], 2*width/10, 3*height/10, 150, 50, 200, 40, "30s", 2*width/10, 3*height/10)
    drawRectButtons(timeOptions["60"][2], 4*width/10, 3*height/10, 150, 50, 200, 40, "60s", 4*width/10, 3*height/10)
    drawRectButtons(timeOptions["90"][2], 6*width/10, 3*height/10, 150, 50, 200, 40, "90s", 6*width/10, 3*height/10)
    drawRectButtons(timeOptions["120"][2], 8*width/10, 3*height/10, 150, 50, 200, 40, "120s", 8*width/10, 3*height/10)  
  }

  fill(200)
  textSize(50)
  textAlign(CENTER, CENTER)
  text(instructionsText, width/2, 2*height/10)

  // actual game selection
  for (const [k, v] of Object.entries(trainingModeOptions[gameModeName])) {
    drawRectButtons(color(0, 200, 0), v[0], v[1], 300, 50, 21, 40, k, v[0], v[1])
  }
}


function gameplay() {
  background(0)


  

  // escape text
  fill(255)
  textSize(25)
  textAlign(LEFT, TOP)
  text("[ESC] to quit", 0, 0)

  // gamemode at the top
  fill(255)
  textSize(25)
  textAlign(RIGHT, TOP)
  text(`${gameModeName}_${subGameModeName}`, width, 0)

  // display game stats in the bottom left corner
  fill(255)
  textSize(20)
  textAlign(LEFT, BOTTOM)

  let killsPerSecond
  let acc

  // REPLACE WITH TERNARY OPERATOR??

  if (gameStats.secondsPassed != 0) {
    killsPerSecond = roundNumber(gameStats.kills / gameStats.secondsPassed, 2)
  } else {
    killsPerSecond = "NaN"
  }

  if (gameStats.clicks != 0) {
    acc = `${roundNumber( (gameStats.hits/gameStats.clicks)*100, 2)}`
  } else {
    acc = "NaN"
  }

  let formatAcc = `(${gameStats.hits.toFixed(1)}/${gameStats.clicks})`
  let formatString = `Kills: ${gameStats.kills}  |  Kills/Second: ${killsPerSecond}  |  Accuracy: ${acc}% ${formatAcc}`

  text(formatString, 0, height)

  if (gameStats.adaptive) {
    fill(color(88,88,255))
    text(20)
    textAlign(LEFT, BOTTOM)
    text(`Difficulty Modifier: ${gameStats.diffMod.toFixed(2)}`, 0, height-20)
  }
  

  if (gameModeName == "Challenge") {
    fill(color(255,88,88))
    text(20)
    textAlign(LEFT, BOTTOM)
    text(`Lives: ${gameStats.lives}`, 0, height-40)
  }

  // create a 3-second countdown timer

  let currentTime
  let n = countdowns.ThreeSecondCountdown
  let g = countdowns.GameplayCountdown
  if (!n.done && g.done && gameRunning) {
    // check if millis exceeded last millis
    n = countdowns["ThreeSecondCountdown"]
    currentTime = millis()

    if (currentTime - n.lastMillisecond > n.delay && n.value > 0) {
      // decrement
      n.value--
      n.lastMillisecond = currentTime
    }

    if (n.value <= 0) {n.done = true; countdowns.GameplayCountdown.done = false; console.log("hit zero"); gameInProgress = true}

    // display the timer
    fill(200)
    textSize(75)
    textAlign(CENTER, TOP)
    text(`Get Ready! (${n.value})`, width/2, 0)

  }


  // run the game, stop once time is up

  if (countdowns.ThreeSecondCountdown.done && !countdowns.GameplayCountdown.done && gameRunning) {
    let gameCountdown = countdowns.GameplayCountdown

    currentTime = millis()

    if (currentTime - gameCountdown.lastMillisecond > gameCountdown.delay && gameCountdown.value > 0) {
      // decrement
      gameCountdown.value--
      gameCountdown.lastMillisecond = currentTime
      gameStats.secondsPassed++
    }

    fill(255)
    textSize(75)
    textAlign(CENTER, TOP)
    let textToDisplay = (gameModeName == "Challenge") ? 99999-gameCountdown.value : gameCountdown.value
    text(`${textToDisplay}`, width/2, 0)

    if (g.value <= 0) {n.done = true; g.done = true; currentStatus = 4}
  }

  // ABSTRACTION: MAKE AN OBJECT CONTAINING ALL FUNCTIONS
  if (gameInProgress) {
    gamemodeFunctions[gameModeName][subGameModeName]()
    gameStats.diffMod -= 0.0002

    if (subGameModeName == "Kills") {
      gameStats.diffMod -= 0.0006
    }
  }
  // generate targets for user to click on

  // MAYBE CAN ABSTRACT THIS???
  // draw the targets

  for (let i = 0; i < gameObjects.circleTargets.length; i++) {
    circleTarget = gameObjects.circleTargets[i]
    
    circleTarget.x += circleTarget.xSpeed
    circleTarget.y += circleTarget.ySpeed

    if (circleTarget.x < width/10 || circleTarget.x > 9*width/10) {
      circleTarget.xSpeed = -circleTarget.xSpeed
    } else if (circleTarget.y < 2*height/10 || circleTarget.y > 8*height/10) {
      circleTarget.ySpeed = -circleTarget.ySpeed
    }

    

    fill(circleTarget.color)
    ellipse(circleTarget.x, circleTarget.y, circleTarget.r)


    if (gameStats.showHealth) {
      fill(127)
      textSize(circleTarget.r/2)
      textAlign(CENTER, CENTER)
      text(`${circleTarget.health}`, circleTarget.x, circleTarget.y)
    }

    if (circleTarget.despawnTime < millis() && circleTarget.despawnTime > 0 && gameStats.adaptive){
      gameObjects.circleTargets.splice(i, 1)
      gameStats.diffMod -= 0.1
    }

    let xRNG = random(0, 101)
    let yRNG = random(0, 101)

    let inXRange = (circleTarget.x >= width/10 && circleTarget.x <= 9*width/10)
    let inYRange = (circleTarget.y >= 2*height/10 && circleTarget.y <= 8*height/10)

    if (xRNG >= (circleTarget.dirProb - gameStats.diffMod*5) && inXRange) {
      // if roll is greater than a certain threshold, reverse
      circleTarget.xSpeed = -circleTarget.xSpeed
    }
    if (yRNG >= (circleTarget.dirProb - gameStats.diffMod*5) && inYRange) {
      // if roll is greater than a certain threshold, reverse
      circleTarget.ySpeed = -circleTarget.ySpeed
    }
  }

  for (let i = 0; i < gameObjects.rectTargets.length; i++) {
    rectTarget = gameObjects.rectTargets[i]
    
    rectTarget.x += rectTarget.xSpeed
    rectTarget.y += rectTarget.ySpeed

    if (rectTarget.x < width/10 || rectTarget.x > 9*width/10) {
      rectTarget.xSpeed = -rectTarget.xSpeed
    } else if (rectTarget.y < 2*height/10 || rectTarget.y > 8*height/10) {
      rectTarget.ySpeed = -rectTarget.ySpeed
    }

    fill(rectTarget.color)
    rect(rectTarget.x, rectTarget.y, rectTarget.w, rectTarget.h)

    if (gameStats.showHealth) {
      fill(127)
      textSize(rectTarget.w/2)
      textAlign(CENTER, CENTER)
      text(`${rectTarget.health}`, rectTarget.x, rectTarget.y)
    }
  }

  for (let i = 0; i < gameObjects.humanoids.length; i++) {
    humanoid = gameObjects.humanoids[i]

    humanoid.circleX += humanoid.xSpeed
    humanoid.rectX += humanoid.xSpeed

    humanoid.circleY += humanoid.ySpeed
    humanoid.rectY += humanoid.ySpeed

    if (humanoid.rectX < width/10 || humanoid.rectX > 9*width/10) {
      humanoid.xSpeed = -humanoid.xSpeed
    } else if (humanoid.rectY < 2*height/10 || humanoid.circleY > 8*height/10) {
      humanoid.ySpeed = -humanoid.ySpeed
    }

    // draw the rectangle (body)
    fill(color(0, 0, 255))
    rect(humanoid.rectX, humanoid.rectY, humanoid.rectW, humanoid.rectH)

    // draw the circle (head)
    fill(color(255, 0, 0))
    circle(humanoid.circleX, humanoid.circleY, humanoid.circleR)

    // create text showing health
    fill(200)
    textSize(25)
    textAlign(CENTER, CENTER)
    text(`${humanoid.health}`, humanoid.rectX, humanoid.rectY)
  }
  
  // TODO: DO HUMANOIDS AS WELL

  // update targets
  // for (let circleTarget of gameObjects.circleTargets) {
    
  // }


  // in challenge, delete and strike

  // track score


  // change direction if reached edge
//let x = random(width/10, 9*width/10)
// let y = random(2*height/10, 8*height/10)


}

function gameOver() {
  performanceBenchmarks = {
    Bronze: [2, 155, 78, 0],
    Silver: [4, 176, 176, 176],
    Gold: [6, 255, 220, 34],
    Platinum: [8, 224, 224, 224],
    Diamond: [10, 126, 255, 255],
    Emerald: [99999, 49, 255, 172],
  }

  background(0)

  fill(255)
  textSize(75)
  textAlign(CENTER, TOP)
  text(`Results`, width/2, 0)

  let killsPerSecond
  let acc
  let rank
  let c1, c2, c3
  gameStats.kps = gameStats.kills / gameStats.secondsPassed
  gameStats.accPct = gameStats.hits / gameStats.clicks * 100
  // console.log(gameStats.accPct)
  gameStats.performanceValue = calculateScaledScore()

  // REPLACE WITH TERNARY OPERATOR??

  if (gameStats.secondsPassed != 0) {
    killsPerSecond = roundNumber(gameStats.kills / gameStats.secondsPassed, 2)
  } else {
    killsPerSecond = "NaN"
  }

  if (gameStats.clicks != 0) {
    acc = `${roundNumber( (gameStats.hits/gameStats.clicks)*100, 2)}`
  } else {
    acc = "NaN"
  }

  // rank = "Diamond"

  // console.log(gameStats.performanceValue)
  for (const [key, value] of Object.entries(performanceBenchmarks)) {
    if (gameStats.performanceValue > value[0]) {
      // continue to iterate
    } else {
      rank = key
      c1 = value[1]
      c2 = value[2]
      c3 = value[3]
      break
    }
  }

  
  let formatAcc = `(${gameStats.hits.toFixed(1)}/${gameStats.clicks})`

  // results screen
  displayText(255, 50, LEFT, CENTER, `Kills: ${gameStats.kills}`, 1*width/8, 2*height/10) // kills

  if (gameModeName != "Challenge") {
    displayText(255, 50, LEFT, CENTER, `Kills/Second: ${killsPerSecond}`, 1*width/8, 3*height/10) // kps
  } else {
    displayText(255, 50, LEFT, CENTER, `Time Lasted: ${gameStats.secondsPassed}s`, 1*width/8, 3*height/10)
  }

  displayText(255, 50, LEFT, CENTER, `Accuracy: ${acc}% ${formatAcc}`, 1*width/8, 4*height/10)

  // rank -- change color to match color of rank later
  // console.log(c1, c2, c3)
  displayText(color(c1, c2, c3), 50, LEFT, CENTER,
    `Rank: ${rank} (${roundNumber(gameStats.performanceValue, 2)}/10)`, 1*width/8, 6*height/10)

  // draw a rectangle to go back to home screen
  drawRectButtons(color(127, 0, 0), width/2, 9*height/10, 400, 100, 200, 50, "Back to Home", width/2, 9*height/10)
}

function calculateScaledScore() {
  let tab = conversionFunctions[`${gameModeName}_${subGameModeName}`]
  let sum = (tab.length == 2) ? (tab[0]() + tab[1]()) : (tab[0]())
  // console.log(tab[1]())
  // console.log(tab[1])

  return sum
}

// *****FUNCTIONS TO HANDLE TARGET MANAGEMENT*****
function spawnCircle(x, y, r, color, borderWeight, xSpeed, ySpeed, health, xSizeSF, ySizeSF,
  despawnTime, halfwayThrough,
  dirProb) {

    strokeWeight(borderWeight)

  let newCircleObject = {
    x: x, y: y, r: r,
    color: color, xSpeed: xSpeed, ySpeed: ySpeed,
    health: health, xSizeSF: xSizeSF, ySizeSF: ySizeSF,
    despawnTime: despawnTime,
    halfwayThrough: halfwayThrough,
    dirProb: dirProb
  }
  gameObjects.circleTargets.push(newCircleObject)
  return newCircleObject
}

function spawnRectangle(x, y, w, h, color, borderWeight, xSpeed, ySpeed, health, xSizeSF, ySizeSF, dirProb) {
  // push a rectangle target into gameObjects.rectTargets
  strokeWeight(borderWeight)
  let newRectObject = {
    x: x, y: y, w: w, h: h,
    color: color, xSpeed: xSpeed, ySpeed: ySpeed,
    health: health, xSizeSF: xSizeSF, ySizeSF: ySizeSF, dirProb: dirProb
  }
  gameObjects.rectTargets.push(newRectObject)
  return newRectObject
}

function spawnHumanoid(circleX, circleY, circleR, rectX, rectY, rectW, rectH, xSpeed, ySpeed, health) {
  // create two shapes and make them one unit
  // maybe use an image instead? don't since need ability to detect headshots

  let newHumanoidObject = {
    circleX: circleX, circleY: circleY, circleR: circleR, // head
    rectX: rectX, rectY: rectY, rectW: rectW, rectH: rectH, // body
    xSpeed: xSpeed, ySpeed: ySpeed, health: health // update stats
  }
  gameObjects.humanoids.push(newHumanoidObject)
  return newHumanoidObject
}

// *****FUNCTIONS FOR GAMEMODES*****



// *****FUNCTION TO LISTEN FOR BUTTON/KEY CLICKS*****
function mousePressed() {
  let targetType = null
  if (currentStatus == 0) {
    if (clickedRectangle(width/2-150, 3*height/4-37.5, 300, 75)) {
      currentStatus = 1
    }
  } else if (currentStatus == 1) {

    for (const [key, value] of Object.entries(menuItemsPositions)) {
      if (clickedRectangle(value[0]-200, value[1]-50, 400, 100)) {
        currentStatus = 2
        gameModeName = key
        console.log(gameModeName)
      }
    }
  } else if (currentStatus == 2) {
    if (mouseX >= 181 && mouseX <= 1099 && mouseY >= 191 && mouseY <= 241) {
      console.log("clicked")
      for (const [key, value] of Object.entries(timeOptions)) {
        if (clickedRectangle(value[0]-75, value[1]-25, 150, 50)) {
          gameDuration = parseInt(key)
          timeOptions[key][2] = color(200, 0, 0)

        } else {
          timeOptions[key][2] = color(0, 0, 200)
        }
      }
    
    } else if (mouseX >= 490 && mouseX <= 790 && mouseY >= 315 && mouseY <= 625) {
      for (const [key, value] of Object.entries(trainingModeOptions[gameModeName])) {
        if (clickedRectangle(value[0]-150, value[1]-20, 300, 50)) {
          subGameModeName = key
          if (subGameModeName == "Regular") {
            gameDuration = 99999
          }
          countdowns.GameplayCountdown.value = gameDuration + 1
          currentStatus = 3
          gameRunning = true
        }
      }
    } 

  } else if (currentStatus == 4) {
    if (mouseX >= 440 && mouseX <= 840 && mouseY >= 598 && mouseY <= 698) {
      countdowns.ThreeSecondCountdown.lastMillisecond = 0
      countdowns.ThreeSecondCountdown.delay = 1000
      countdowns.ThreeSecondCountdown.value = 4
      countdowns.ThreeSecondCountdown.done = false

      countdowns.GameplayCountdown.lastMillisecond = 0
      countdowns.GameplayCountdown.delay = 1000
      countdowns.GameplayCountdown.value = 61
      countdowns.GameplayCountdown.done = true

      countdowns.ChallengeStopwatch.lastMillisecond = 0
      countdowns.ChallengeStopwatch.delay = 1000
      countdowns.ChallengeStopwatch.value = 0
      countdowns.ChallengeStopwatch.done = false

      gameObjects.circleTargets = []
      gameObjects.rectTargets = []
      gameObjects.humanoids = []

      gameStats = {kills: 0, hits: 0, clicks: 0, secondsPassed: -1, diffMod: 0, performance: 0, threshold: 0, 
        hitTarget: false, adaptive: false, showHealth: false, stillTarget: true, movingTargetRight: true, 
        lives: 3, speed: 0, lastSecond: -2, challengeLastMS: 0, nextSpawnTime: 0,
      }

      gameRunning = false
      gameInProgress = false
      threeSecondCountdown = 4
      lastMillisecond = 0
      currentStatus = 0
    }

    

  } else if (currentStatus == 3 && gameModeName != "Tracking") {
    gameStats.clicks++
    if (gameModeName == "Accuracy" || gameModeName == "Tracking" || gameModeName == "Challenge") {
      targetType = "circleTargets"
    } else if (gameModeName == "Sniping") {
      if (subGameModeName == "Fast" || subGameModeName == "Shrinking") {
        targetType = "circleTargets"
      } else if (subGameModeName == "Dummies") {
        targetType = "humanoids"
      }
    } else if (gameModeName == "Tile Frenzy") {
      targetType = "rectTargets"
    }

    let targets = gameObjects[targetType]

    checkMouseClickedTarget(targetType)


    if (!gameStats.hitTarget) {
      gameStats.threshold -= 0.5

      if (gameModeName != "Accuracy") {gameStats.diffMod -= 0.1}
    } else {
      for (let i = 0; i < targets.length; i++) {
        let target = targets[i]
        if ((targetType == "circleTargets" || targetType == "rectTargets") && gameStats.adaptive) {
          target.xSpeed = (target.xSpeed > 0) ?
          max(1, target.xSpeed + gameStats.diffMod) : min(-1, target.xSpeed - gameStats.diffMod)
  
          target.ySpeed = (target.ySpeed > 0) ?
          max(1, target.ySpeed + gameStats.diffMod) : min(-1, target.ySpeed - gameStats.diffMod)
        } else if (targetType == "humanoids" && gameStats.adaptive) {

        }
      }
    }

    if (gameStats.threshold <= -1) {
      gameStats.threshold = 0
      gameStats.diffMod -= 0.5
    }

    gameStats.hitTarget = false
  }
}

function checkMouseClickedTarget(targetType) {
  let targets = gameObjects[targetType]
  for (let i = 0; i < targets.length; i++) {
    let target = targets[i]
    let maxSpeed = max(target.xSpeed, target.ySpeed)


 
    if (targetType == "circleTargets") {
      if (clickedCircle(target.x, target.y, (target.r)+(maxSpeed)*2)) {
        target.health -= 100
        gameStats.hits++
        gameStats.threshold += 0.5
        gameStats.hitTarget = true

        if (target.health <= 0) {
          gameStats.kills++
          targets.splice(i, 1)
        }

        if (gameStats.threshold >= 1) {
          gameStats.threshold = 0
          gameStats.diffMod += 0.5
        }
        break
      }
    } else if (targetType == "rectTargets") {
      if (clickedRectangle(target.x-target.w/2, target.y-target.h/2, target.w, target.h)) {
        target.health -= 100
        gameStats.hits++
        gameStats.threshold += 0.5
        gameStats.hitTarget = true

        if (target.health <= 0) {
          gameStats.kills++
          targets.splice(i, 1)
        }
      }
    } else if (targetType == "humanoids") {

      if (clickedCircle(target.circleX, target.circleY, (target.circleR)+(maxSpeed)*2)) {

        target.health -= 300
        gameStats.hits += roundNumber((1 + maxSpeed*0.2), 1)

        if (target.health <= 0) {
          gameStats.kills++
          targets.splice(i, 1)
        }
        break
      } else if (clickedRectangle(target.rectX-target.rectW/2-(maxSpeed*2),
      target.rectY-target.rectH/2-(maxSpeed*2),
      target.rectW, target.rectH
      )) {
        target.health -= Math.floor(random(50, 151))
        gameStats.hits++

        if (target.health <= 0) {
          gameStats.kills++
          targets.splice(i, 1)
        }
        break
      }
    }

  }
}

function keyPressed() {
  // escape key
  if (keyCode == 27) {
    if (currentStatus == 1) { // select game mode
      currentStatus = 0 // home
    } else if (currentStatus == 2) { // game settings
      currentStatus = 1 // select game mode
    } else if (currentStatus == 3) {
      currentStatus = 4 // game over
    }
  }
}

// *****CONVENIENCE FUNCTIONS*****
function clickedCircle(x, y, d) {
  // assuming diameter
  // turn this into a ternary operator?
  // console.log(d/2, dist(mouseX, mouseY, x, y))
  if (dist(mouseX, mouseY, x, y) < d/2) {
    return true
  } else {
    return false
  }
}

function clickedRectangle(rectX, rectY, width, height) {
  if (
    mouseX >= rectX && mouseX <= rectX+width &&
    mouseY >= rectY && mouseY <= rectY+height
  ) {
    return true
  } else {
    return false
  }
}

function drawRectButtons(rectColor, rectX, rectY, rectW, rectH, textColor, txtSize, txt, textX, textY) {
  rectMode(CENTER)
  fill(rectColor)
  rect(rectX, rectY, rectW, rectH)
  fill(textColor)
  textSize(txtSize)
  textAlign(CENTER, CENTER)
  text(txt, textX, textY)
}

function roundNumber(number, decimals) {
  if (number != 0) {
    return Math.round(number * 10**decimals) / 10**decimals
  } else {
    return 0
  }
}

function displayText(color, size, xAlign, yAlign, content, xPos, yPos) {
  fill(color)
  textSize(size)
  textAlign(xAlign, yAlign)
  text(content, xPos, yPos)
}