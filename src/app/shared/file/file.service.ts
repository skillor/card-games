import { Injectable } from '@angular/core';
import { first, fromEvent, map, Observable, switchMap } from 'rxjs';

@Injectable()
export class FileService {

  constructor() { }

  saveFile(filename: string, content: string): void {
    const a = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
  }

  loadFile(accept: string): Observable<string> {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.accept = accept;

    document.body.appendChild(input);

    const onEnd = () => {
        document.body.removeChild(input);
    };

    let obs = fromEvent(input, 'change').pipe(
      first(),
      switchMap(() => {
        if (!input.files || input.files.length == 0 || input.files[0].size > 250000000 || !FileReader) {
          onEnd();
          throw Error('something went wrong');
        }
        const file = input.files[0];
        const fileReader = new FileReader();

        let obs = fromEvent(fileReader, 'load').pipe(
          first(),
          map((event) => {
            let e: any = event;
            if (!e.target || !e.target.result) {
              onEnd();
              throw new Error('something went wrong');
            }
            let content: string;
            if (typeof e.target.result === 'string') {
                content = e.target.result;
            } else {
                content = new TextDecoder().decode(e.target.result);
            }
            return content;
          }),
        )
        fileReader.readAsText(file);
        return obs;
      }),
    );

    input.click();
    return obs;
  }
}
