// autobind decorator
/*
function autobind(
  _: any,
  _2: any,
  descriptor?: PropertyDescriptor
) : any {
  const originalMethod = descriptor?.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    }
  };
  return adjDescriptor;
}
*/
//use enum as we only have two types of values here so they are like constants
//use them when creating a new project and putting projecst into correct list
enum ProjectStatus {Active, Finished}

//definition of what a listener is ie a function that accepts an array of projects and returns noting (void). We are not iterested in the return type.
type Listener = (items:Project[]) => void;

//Prohect Type Class
class Project {
  public constructor(public id: string, public title: string, public description: string, public people:number, public status: ProjectStatus) {

  }
}
//this is a singleton class - can only create one instance of it.

class ProjectState {
  private listeners: Listener[] = []; //array of functions called when we add a new project
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {}

  //must have a getInstance if Singleton class
  //check if instanc eexists and return it if it does else create one instance
  static getInstance(): ProjectState {
    if (!ProjectState.instance) {
      ProjectState.instance = new ProjectState();
    }
    return ProjectState.instance;
  }
  //track a project - add to projecst array and listeners
  addProject(title: string, description: string, numPeople: number) {
    //note id not necessarily guaranteed to be unique but ok for this project
    const newProject = new Project(Math.random().toString(), title, description, numPeople, ProjectStatus.Active)
    

    this.projects.push(newProject);
    for (const listenerFn of this.listeners) {
      //call function with copy of projects array not original as we dont want original changed
      //use slice to get copy of array - start and end parameters not provided so get whole array returned
      listenerFn(this.projects.slice());

    }
  }

  //this is an array of functions, when you create a new ProjectList the constructor adds a new function to this array
  //the ProjectList function adds the function to the assignedProjects array in ProjectList and renders the list of projects
  addListener(listenerFn: Listener) {
    this.listeners.push(listenerFn);
    console.log("LISTENERS : " + this.listeners)
  }
}

//create global instance of this class so its available to everything in this file
const projectState = ProjectState.getInstance();

interface Validateable {
  value: string | number ;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}
//validation function
function validate(dataToValidate : Validateable) {
  let isValid = true;
  if (dataToValidate.required) {
    isValid = isValid && dataToValidate.value.toString().trim().length !== 0;
  }
  if (dataToValidate.minLength != null && typeof dataToValidate.value === 'string') {
    isValid = isValid && dataToValidate.value.trim().length > dataToValidate.minLength;
  }
  if (dataToValidate.maxLength != null && typeof dataToValidate.value === 'string') {
    isValid = isValid && dataToValidate.value.trim().length <= dataToValidate.maxLength;
  }
  if (dataToValidate.min != null && typeof dataToValidate.value === 'number') {
    isValid = isValid && dataToValidate.value > dataToValidate.min;
  }
  if (dataToValidate.max != null && typeof dataToValidate.value === 'number') {
    console.log(dataToValidate.value, dataToValidate.max);
    isValid = isValid && dataToValidate.value <= dataToValidate.max;
  }
  return isValid;

}

//ProjectList
 class ProjectList {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement; //there are various types of HTML elements so use specific one if available
  element: HTMLElement; //this is a section but there are no HTMLSection types!
  assignedProjects: Project[];
  
  //pass private variable so this automatically makes 'type' a property of the class
    constructor(private type: 'active' | 'finished') {
    //template element in index.html holds HTML that is not visible - 
    this.templateElement = document.getElementById('project-list')! as HTMLTemplateElement;
    this.hostElement = document.getElementById('app')! as HTMLDivElement;
    this.assignedProjects = []; //just initialise to empty array
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as HTMLElement;
    //use 'this' so typescript does not complain that we are not using the parameter
    this.element.id = `${this.type}-projects`;

    //overwrite assigned projects with new array of projects and pass addListener a function
    projectState.addListener((projects: Project[]) => {
      //filter first so only relevant projects are added to this ProjectList
      const relevantProjects = projects.filter(prj => {
        if (this.type === 'active') {
          return prj.status === ProjectStatus.Active;
        }
        return prj.status === ProjectStatus.Finished;
      });
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });

    this.attach();
    this.renderContent();
  }

  private renderProjects() {
    const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
    listEl.innerHTML = ''; //clear all previous displayed projects before displaying new ones
    for (const prjItem of this.assignedProjects) {
      const listItem = document.createElement('li');
      listItem.textContent = prjItem.title;
      listEl.appendChild(listItem);

    }
  }

  private attach() {
    //insert new element before the closing tag on the element
    this.hostElement.insertAdjacentElement('beforeend', this.element);
  }

  private renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent = this.type.toString().toUpperCase() + " PROJECTS";
  }
}

// ProjectInput Class
class ProjectInput {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLFormElement;
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement;
    this.hostElement = document.getElementById('app')! as HTMLDivElement;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as HTMLFormElement;
    this.element.id = 'user-input';

    this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;
    //add event listener
    this.configure();
    this.attach();
  }

  //@autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    //console.log(this.titleInputElement.value);
    const inputDetails = this.getDetails();
    if (Array.isArray(inputDetails)) {
      const [title, desc, people ] = inputDetails;
      console.log(title, desc, people);
      projectState.addProject(title, desc, people);
    }
    this.clearInputs();
  }

  private configure() {
    this.element.addEventListener('submit', this.submitHandler.bind(this));
  }

  private attach() {
    //insert new element just inside the opening tag of element from template
    this.hostElement.insertAdjacentElement('afterbegin', this.element);
  }

  //get input from user and validate
  private getDetails (): [string, string, number] | void {
    const inputTitle = this.titleInputElement.value;
    const inputDesc = this.descriptionInputElement.value;
    //convert to number
    const inputPeople = +this.peopleInputElement.value;

    //create objects based on Validatable interface to pass to Validate function
    const titleValidate: Validateable = {
      value: inputTitle,
      required: true,
    }

    const descValidate: Validateable = {
      value: inputDesc,
      required: true,
      minLength: 5,
    }

    const peopleValidate: Validateable = {
      value: inputPeople,
      required: true,
      min: 1,
      max: 5
    }

    if (!validate(titleValidate) || !validate(descValidate) || !validate(peopleValidate)){
      alert('Invalid input please try again.');
      return;
    } else {
      return [inputTitle, inputDesc, +inputPeople];
    }
  }

  private clearInputs() {
    this.titleInputElement.value = '';
    this.descriptionInputElement.value = '';
    this.peopleInputElement.value = '';
  }
}

const prjInput = new ProjectInput();
const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');
