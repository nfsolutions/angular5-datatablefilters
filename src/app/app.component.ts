import { Component, ViewChild, OnInit } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';

// Angular Material 2
import { MatSort } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';

// Services
import { StudentService } from './student.service';

// rxjs
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  @ViewChild(MatSort) sort: MatSort;

  studentDetails = {
    studentName: '',
    studentAge: '',
    studentGrade: ''
  };

  filter = {
    field: 'studentAge',
    criteria: '',
    filtervalue: ''
  };
  displayedColumns = ['Name', 'Age', 'Grade'];
  studentDatabase = new StudentDatabase(this.studentService);
  dataSource;

  constructor(private studentService: StudentService, private afs: AngularFirestore) {
  }

  ngOnInit() {
    console.log('appcomponent: oninit');
    this.dataSource = new StudentDataSource(this.studentDatabase, this.sort);
  }

  addStudent() {
    this.studentService.addStudent(this.studentDetails);
  }

  filterData() {
    this.studentService.filterData(this.filter).then((res: any) => {
      res.subscribe((some) => {
        console.log(some);
      });
      this.dataSource = new FilteredDataSource(res);
    });
  }

  resetFilters() {
    this.dataSource = new StudentDataSource(this.studentDatabase, this.sort);
  }
}

export class StudentDatabase {

  studentList = new BehaviorSubject([]);
  get data() { return this.studentList.value; }

  constructor(private studentService: StudentService) {
    this.studentService.getStudents().subscribe((student) => {
      this.studentList.next(student);
    });
  }
}

export class StudentDataSource extends DataSource<any> {

  constructor(private studentDB: StudentDatabase, private sort: MatSort) {
    super();
  }

  connect(): Observable<any> {
    console.log('StudentDataSource: connect');
    const studentData = [
      this.studentDB.studentList,
      this.sort.sortChange
    ];

    return Observable.merge(...studentData).map(() => {
      console.log('StudentDataSource: connect: return Observable.merge');
      return this.getSortedData();
    });
  }

  disconnect() {
  }

  getSortedData() {
    const data = this.studentDB.data.slice();
    if (!this.sort.active || this.sort.direction === '') { return data; }

    return data.sort((a, b) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';

      switch (this.sort.active) {
        case 'Name': [propertyA, propertyB] = [a.studentName, b.studentName]; break;
        case 'Age': [propertyA, propertyB] = [a.studentAge, b.studentAge]; break;
        case 'Grade': [propertyA, propertyB] = [a.studentGrade, b.studentGrade]; break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) * (this.sort.direction === 'asc' ? 1 : -1);
    });
  }
}

export class FilteredDataSource extends DataSource<any> {

  constructor(private inputobs) {
    super();
  }

  connect(): Observable<any> {
    return this.inputobs;
  }

  disconnect() {
  }
}
