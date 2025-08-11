import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textSlice'
})
export class TextSlicePipe implements PipeTransform {

  transform(text: string, arg: number): string {
    return text.slice(0,arg)+ "...";
  }

}
