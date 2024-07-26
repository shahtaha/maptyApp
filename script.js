'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
// let map, mapEvent;

class Workout {
  date = new Date();

  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.descrption = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    }
${this.date.getDate()}  `;
  }
}

class running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.clacPace();
    this._setDescription();
  }

  clacPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    //km/h
    this.Speed = this.distance / (this.duration / 60);
    return this.Speed;
  }
}

// const run1 = new running([39, -120], 25, 12.5, 179);
// console.log(run1);

/////////////////////////////////////////////////////////////////////////////////////
// App architecture ....
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workout = [];
  constructor() {
    this._getPosition();

    // render localstorage forms
    this._getLocalStorage();
    //other listeners
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('could not find your location!');
        }
      );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    // const { longitude } = position.coords;

    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    // here L is a utility class for leaflet and  ( map) is the plan of html div where you want to add
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel); // 13 is a zoomed number

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showform.bind(this));

    this.#workout.forEach(work => {
      this._renderWorkoutMaker(work);
    });
  }

  _showform(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // clear the input fileds
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
    // again hide the form
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // helper function
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    /////////////////////////////
    e.preventDefault();

    // get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //if workout running ,  create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if the data is valid
      if (
        //   !Number.isFinite(distance) ||
        //   !Number.isFinite(duration) ||
        //   !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('inputs have to be positive numbers');
      workout = new running([lat, lng], distance, duration, cadence);
    }

    //if workout cycling ,  create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return 'inputs have to be positive numbers';
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //hiding the form and diaplay the new from
    this._hideForm();

    // add new object into the workout array
    this.#workout.push(workout);
    console.log(workout);

    //render workout on the map as marker
    this._renderWorkoutMaker(workout);

    ///render workout on the the side  bar
    this._renderWorkout(workout);

    // set workout to local storage
    this._setLocalStorage();
  }
  //
  _renderWorkoutMaker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚴'} ${workout.descrption}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id='${workout.id}'>
          <h2 class="workout__title">${workout.descrption}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃' : '🚴'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running')
      html += `<div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
              </div>
              <div class="workout__details">
               <span class="workout__icon">🦶🏼</span>
               <span class="workout__value">${workout.cadence}</span>
               <span class="workout__unit">spm</span>
              </div>
              </li>`;

    if (workout.type === 'cycling')
      html += `<div class="workout__details">
                 <span class="workout__icon">⚡️</span>
                 <span class="workout__value">${workout.Speed.toFixed(1)}</span>
                 <span class="workout__unit">km/h</span>
               </div>
               <div class="workout__details">
                 <span class="workout__icon">⛰</span>
                 <span class="workout__value">${workout.elevationGain}</span>
                 <span class="workout__unit">m</span>
               </div>
               </li> `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);
    if (!workoutEl) return;
    const workout = this.#workout.find(
      work => work.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workout = data;
    this.#workout.forEach(work => {
      this._renderWorkout(work);
    });
  }
}

const app = new App();

////////////////////////////////////////////////////////////////////////////////////////////
//project planning

// planing step
/* 
 1) user story   (discription of project from client precptive and demand)
    common format : as a[type of user], i want [an action] so that [a benefit]
  
 2) features 
 3) flow chart (what we will built)
 4) Arichitecture()

// Deveolping step
*/

//////////////////////////////////////////////////////////////////////////////////////////////
// geo loacation APi

////////////////////////////////////////////////////////////////////////////////////////////
// project architecture
/*
 is all about giving the projetc structure ...anyway

1) alway make a app class oop  than store all the method and data into it and make 
the child class that inheriate method the from the its parent class and some of 
it own method, 
2) then apply the related method to the its same ones.
3) it is good to first make the method and work ready functinaly then sturcture it

*/
