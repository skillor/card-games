import { Injectable } from '@angular/core';
import { first, fromEvent, map, Observable, switchMap } from 'rxjs';

@Injectable()
export class FileService {

  constructor() { }

  saveFileUrl(filename: string, url: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }

  saveFileBlob(filename: string, blob: Blob): void {
    return this.saveFileUrl(filename, URL.createObjectURL(blob));
  }

  saveFile(filename: string, content: string): void {
    return this.saveFileBlob(filename, new Blob([content], {type: 'text/plain'}));
  }

  loadRawFile(accept: string): Observable<File> {
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
      map(() => {
        if (!input.files || input.files.length == 0 || input.files[0].size > 250000000 || !FileReader) {
          onEnd();
          throw Error('something went wrong');
        }
        const file = input.files[0];
        onEnd();
        return file;
      }),
    );

    input.click();
    return obs;
  }

  loadFile(accept: string): Observable<string> {
    return this.loadRawFile(accept).pipe(
      switchMap((file) => {
        const fileReader = new FileReader();

        let obs = fromEvent(fileReader, 'load').pipe(
          first(),
          map((event) => {
            let e: any = event;
            if (!e.target || !e.target.result) {
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
      })
    )
  }
}
