import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {HttpClient} from '@angular/common/http';
import {MatTableDataSource} from '@angular/material';

interface IPerson {
  name: string;
}

interface ITodoListItem {
  description: string;
  assignedTo: string;
}

interface ITodoListDisplayItem extends ITodoListItem {
  done: boolean;
  id: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  onlyShowDone: boolean = false;
  availablePersons: string[] = ['Nobody'];
  dataSource: MatTableDataSource<ITodoListDisplayItem> = null;
  displayedColumns: string[] = ['description', 'assignedTo', 'done', 'id'];
  filteredPerson: string = '!nofilter';
  addPersonErrorMsg: string = "";
  private cachedData: ITodoListDisplayItem[];
  private negativIdCounter: number = -1;

  constructor(private http: HttpClient) {
    this.loadToDoListItem();
    this.loadAvailablePersons();
  }
  //Lädt alle Personen von der API und erstellt eine neue Datasource
  loadToDoListItem() {
    this.http.get<Array<ITodoListDisplayItem>>('http://localhost:8080/api/todos').subscribe(items => {
      this.dataSource = new MatTableDataSource(items);
      this.cachedData = items;
    });
  }

  loadAvailablePersons() {
    //Lädt alle Personen in das availablePersons Array
    this.http.get<Array<IPerson>>('http://localhost:8080/api/people').subscribe(persons => persons.forEach(person => this.availablePersons.push(person.name)));
  }
  //Wird aufgerufen wenn sich einer der Filter geändert hat. Ändert die Datasource und zeigt dadurch nur mehr die Gefilterten Todos an
  filtersChanged() {
    this.dataSource.data = this.cachedData;
    if (this.onlyShowDone)
      this.dataSource.data = this.cachedData.filter(item => !item.done);

    if (this.filteredPerson != '!nofilter')
      this.dataSource.data = this.dataSource.data.filter(item => item.assignedTo === this.filteredPerson);
  }
  //Wird aufgerufen wenn die Description in der Tabelle geändert wurde. Updated die Daten auch auf der REST-Schnitstelle
  tableDescriptionInputChanged(evt, id): void {
    this.http.patch('http://localhost:8080/api/todos/' + id, {description: evt.srcElement.value}).subscribe(data => this.loadToDoListItem());
  }
  //Wird aufgerufen wenn 'AssignedTo' in der Tabelle geändert wurde. Updated die Daten auch auf der REST-Schnitstelle
  tableAssignedToChaned(evt, id) {
    this.http.patch('http://localhost:8080/api/todos/' + id, {assignedTo: evt.value}).subscribe(data => this.loadToDoListItem());
  }
  //Wird aufgerufen wenn die Checkbox in der Tabelle geändert wurde. Updated die Daten auch auf der REST-Schnitstelle
  tableDoneChanged(evt, id) {
    this.http.patch('http://localhost:8080/api/todos/' + id, {done: evt.checked}).subscribe(data => this.loadToDoListItem());
  }
  //Wird durch den Delete Button in der Tabelle aufgerufen. Löscht das Todo in der REST-Schitstelle
  deleteButtonPressed(evt, id): void {
    this.http.delete('http://localhost:8080/api/todos/' + id).subscribe(data => this.loadToDoListItem());
  }
  //Überprüft ob die Person bereits exisitiert; Falls ja => zeigt Fehlermeldung an; Falls nicht => Wird die Person in das availalbePersons Array aufgenommen
  //und auch in die REST-Schnittstelle eingebunden
  addNewPerson(name: string): void {
    if(this.availablePersons.filter(value => name === value).length === 0){
      this.addPersonErrorMsg='';
      this.http.post<IPerson>('http://localhost:8080/api/people',{name : name}).subscribe(value => this.availablePersons.push(value.name));
    }else{
      this.addPersonErrorMsg = "Diese Person wurde bereits hinzugefügt";
      setTimeout(()=>{this.addPersonErrorMsg=""},2500);
    }
  }
  //Fügt ein neues Todo Item Hinzu und tud dies auch auf dem Server
  addNewTodo(): void {
    this.http.post('http://localhost:8080/api/todos/', {assignedTo: '', description: 'No description!'}).subscribe(res => {
      this.loadToDoListItem();
      console.log(res);
    });

  }
}
