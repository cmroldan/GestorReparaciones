import { FormControl } from '@angular/forms';

import { moneyValidator, optionalMoneyValidator } from './money-validator';

describe('money validators', () => {
  it('moneyValidator rejects empty, unparseable and negative amounts', () => {
    expect(moneyValidator(new FormControl(''))).toEqual({ required: true });
    expect(moneyValidator(new FormControl('abc'))).toEqual({ invalidMoney: true });
    expect(moneyValidator(new FormControl('-10,00'))).toEqual({ invalidMoney: true });
  });

  it('moneyValidator accepts valid amounts including zero', () => {
    expect(moneyValidator(new FormControl('1.250,50'))).toBeNull();
    expect(moneyValidator(new FormControl(0))).toBeNull();
  });

  it('optionalMoneyValidator accepts blank values as "no budget"', () => {
    expect(optionalMoneyValidator(new FormControl(''))).toBeNull();
    expect(optionalMoneyValidator(new FormControl('   '))).toBeNull();
    expect(optionalMoneyValidator(new FormControl(null))).toBeNull();
  });

  it('optionalMoneyValidator rejects unparseable and negative non-blank amounts', () => {
    expect(optionalMoneyValidator(new FormControl('abc'))).toEqual({ invalidMoney: true });
    expect(optionalMoneyValidator(new FormControl('-1'))).toEqual({ invalidMoney: true });
    expect(optionalMoneyValidator(new FormControl('1250,50'))).toBeNull();
  });
});
