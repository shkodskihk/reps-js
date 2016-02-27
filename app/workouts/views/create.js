import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import Syphon from 'backbone.syphon';

import {SetModel} from '../models/workout';
import {SetList} from '../collections/workouts';
import {SetListView} from './exercise';

import {ExerciseContainerView} from '../../exercises/views/list';
import {ExerciseList} from '../../exercises/collections/exercises';
import {SearchModel} from '../../exercises/models/search';


const ExerciseView = ExerciseContainerView.extend({
  className: ''
});

const SetView = Marionette.View.extend({
  tagName: 'li',
  className: 'list-group-item',
  template: require('../templates/create/set.html')
});

const SmallSetListView = SetListView.extend({
  childView: SetView
});

const SetLayoutView = Marionette.View.extend({
  tagName: 'form',
  className: 'form-horizontal',

  attributes: {
    method: 'post',
    action: ''
  },

  template: require('../templates/create/setform.html'),

  ui: {
    initial: '#id_weight',
    exerciseName: '#id_exercise_name'
  },

  regions: {
    previous: '.previous-exercise-hook'
  },

  events: {
    submit: 'addSet',
    'change @ui.exerciseName': 'searchExercises'
  },

  modelEvents: {
    change: 'render refocus'
  },

  collectionEvents: {
    add: 'fetchIds'
  },

  initialize: function() {
    const search = new SearchModel(this.model.pick('exercise_name'));
    const exerciseList =  new ExerciseList(null, {
      searchModel: search
    });
    this.options.exerciseList = exerciseList;
    this.options.searchModel = search;
  },

  onBeforeAttach: function() {
    const exerciseList = this.getOption('exerciseList');
    this.listenTo(exerciseList, 'sync', this.showPreviousWorkout);
  },

  onBeforeEmpty: function() {
    const exerciseList = this.getOption('exerciseList');
    this.stopListening(exerciseList);
  },

  onRender: function() {
    this.showPreviousWorkout();
  },

  addSet: function(e) {
    e.preventDefault();
    this.model.set(Syphon.serialize(this));

    if (this.model.isValid()) {
      this.collection.add(this.model.pick('exercise_name', 'weight', 'reps'));
      this.model.clearExerciseAttrs();
    }
  },

  refocus: function() {
    this.ui.initial.focus();
  },

  fetchIds: function(model, collection) {
    collection.setExerciseIds();
    if (!model.get('exercise')) {
      model.fetchExercise({
        success: () => collection.setExerciseIds()
      });
    }
  },

  searchExercises: function() {
    const data = Syphon.serialize(this);
    const exerciseName = data.exercise_name;
    const search = this.getOption('searchModel');
    const exerciseList = this.getOption('exerciseList');

    if (exerciseName) {
      search.set({exercise_name: exerciseName});
      exerciseList.fetch();
    }
  },

  showPreviousWorkout: function() {
    const previous = this.getRegion('previous');
    const exerciseList = this.getOption('exerciseList');

    if (exerciseList.length) {
      let exercise = exerciseList.at(0);
      previous.show(new ExerciseView({
        model: exercise,
        collection: new SetList(exercise.getLastExercise()),
        index: 0
      }));
    }
    else if (previous.hasView()) {
      previous.empty();
    }
  }
});

export const CreateWorkout = Marionette.View.extend({
  template: require('../templates/create/layout.html'),

  events: {
    'click @ui.save': 'saveWorkout'
  },

  triggers: {
    'click @ui.cancel': 'show:list'
  },

  modelEvents: {
    sync: 'saveComplete'
  },

  ui: {
    cancel: '.cancel-create',
    save: '.save-workout'
  },

  regions: {
    setForm: '.setform-hook',
    setList: '.setlist-hook'
  },

  initialize: function() {
    this.collection = new SetList(null);
  },

  onRender: function() {
    this.showChildView('setForm', new SetLayoutView({
      model: new SetModel(),
      collection: this.collection
    }));
    this.showChildView('setList', new SmallSetListView({
      collection: this.collection
    }));
  },

  saveWorkout: function(e) {
    e.preventDefault();
    const data = Syphon.serialize(this);
    this.model.save({
      workout_date: data.workout_date,
      sets: this.collection
    });
  },

  saveComplete: function() {
    this.triggerMethod('add:to:collection', this.model);
    this.triggerMethod('show:list');
  },

  onShowList: function() {
    Backbone.history.navigate('workout/');
  }
});
