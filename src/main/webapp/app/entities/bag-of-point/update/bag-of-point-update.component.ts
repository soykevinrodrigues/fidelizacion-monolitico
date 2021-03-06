import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import * as dayjs from 'dayjs';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';

import { IBagOfPoint, BagOfPoint } from '../bag-of-point.model';
import { BagOfPointService } from '../service/bag-of-point.service';
import { IClient } from 'app/entities/client/client.model';
import { ClientService } from 'app/entities/client/service/client.service';

@Component({
  selector: 'jhi-bag-of-point-update',
  templateUrl: './bag-of-point-update.component.html',
})
export class BagOfPointUpdateComponent implements OnInit {
  isSaving = false;

  clientsSharedCollection: IClient[] = [];

  editForm = this.fb.group({
    id: [],
    asignationDate: [null],
    expirationDate: [null],
    assignedScore: [null],
    scoreUsed: [null],
    scoreBalance: [null],
    operationAmount: [null, [Validators.required]],
    state: [null],
    client: [null, [Validators.required]],
  });

  constructor(
    protected bagOfPointService: BagOfPointService,
    protected clientService: ClientService,
    protected activatedRoute: ActivatedRoute,
    protected fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ bagOfPoint }) => {
      if (bagOfPoint.id === undefined) {
        const today = dayjs().startOf('day');
        bagOfPoint.asignationDate = today;
        bagOfPoint.expirationDate = today;
      }

      this.updateForm(bagOfPoint);

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  create(): void {
    this.isSaving = true;
    const bagOfPoint = this.createFromForm();
    this.subscribeToSaveResponse(this.bagOfPointService.create(bagOfPoint));
  }

  trackClientById(index: number, item: IClient): number {
    return item.id!;
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IBagOfPoint>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe(
      () => this.onSaveSuccess(),
      () => this.onSaveError()
    );
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(bagOfPoint: IBagOfPoint): void {
    this.editForm.patchValue({
      id: bagOfPoint.id,
      asignationDate: bagOfPoint.asignationDate ? bagOfPoint.asignationDate.format(DATE_TIME_FORMAT) : null,
      expirationDate: bagOfPoint.expirationDate ? bagOfPoint.expirationDate.format(DATE_TIME_FORMAT) : null,
      assignedScore: bagOfPoint.assignedScore,
      scoreUsed: bagOfPoint.scoreUsed,
      scoreBalance: bagOfPoint.scoreBalance,
      operationAmount: bagOfPoint.operationAmount,
      state: bagOfPoint.state,
      client: bagOfPoint.client,
    });

    this.clientsSharedCollection = this.clientService.addClientToCollectionIfMissing(this.clientsSharedCollection, bagOfPoint.client);
  }

  protected loadRelationshipsOptions(): void {
    this.clientService
      .query()
      .pipe(map((res: HttpResponse<IClient[]>) => res.body ?? []))
      .pipe(map((clients: IClient[]) => this.clientService.addClientToCollectionIfMissing(clients, this.editForm.get('client')!.value)))
      .subscribe((clients: IClient[]) => (this.clientsSharedCollection = clients));
  }

  protected createFromForm(): IBagOfPoint {
    return {
      ...new BagOfPoint(),
      operationAmount: this.editForm.get(['operationAmount'])!.value,
      client: this.editForm.get(['client'])!.value,
    };
  }
}
