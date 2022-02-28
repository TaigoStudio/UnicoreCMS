import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { Period } from 'src/game/donate/entities/period.entity';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { DonatePermission } from 'src/game/donate/permissions/entities/donate-permission.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Kit } from 'src/game/store/entities/kit.entity';
import { Product } from 'src/game/store/entities/product.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { Repository } from 'typeorm';
import { History } from './entities/history.entity';
import { HistoryType } from './enums/history-type.enum';

@Injectable()
export class HistoryService {
  constructor(@InjectRepository(History) private historyRepository: Repository<History>) { }

  create(type: HistoryType.ProductPurchase, ip: string, user: User, product: Product, server: Server, amount: number);
  create(type: HistoryType.KitPurchase, ip: string, user: User, product: Kit, server: Server);
  create(type: HistoryType.DonateGroupPurchase, ip: string, user: User, donateGroup: DonateGroup, server: Server, period: Period);
  create(type: HistoryType.DonatePermissionPurchase, ip: string, user: User, donatePermission: DonatePermission, server: Server, period: Period);
  create(type: HistoryType.Payment, ip: string, user: User, payment: Payment);
  create(type: HistoryType.MoneyServerTransfer, ip: string, user: User, server: Server, amount: number);
  create(type: HistoryType.RealTransfer, ip: string, user: User, target: User, amount: number);
  create(type: HistoryType.MoneyTransfer, ip: string, user: User, server: Server, target: User, amount: number);
  create(type: HistoryType, ip: string, user: User, payload?: any, secondPayload?: any, thirdPayload?: any) {
    const history = new History()
    history.user = user;
    history.type = type;
    history.ip = ip;

    switch (type) {
      case HistoryType.ProductPurchase:
        history.product = payload;
        history.server = secondPayload;
        history.amount = thirdPayload;

        return this.historyRepository.save(history)
      case HistoryType.KitPurchase:
        history.kit = payload;
        history.server = secondPayload;

        return this.historyRepository.save(history)
      case HistoryType.DonateGroupPurchase:
        history.donate_group = payload ;
        history.server = secondPayload;
        history.period = thirdPayload;

        return this.historyRepository.save(history)
      case HistoryType.DonatePermissionPurchase:
        history.donate_permission = payload;
        history.server = secondPayload;
        history.period = thirdPayload;

        return this.historyRepository.save(history)
      case HistoryType.Payment:
        history.payment = payload;

        return this.historyRepository.save(history)
      case HistoryType.RealTransfer:
        history.target = payload;
        history.amount = secondPayload;

        return this.historyRepository.save(history)
      case HistoryType.MoneyTransfer:
        history.server = payload;
        history.target = secondPayload;
        history.amount = thirdPayload;

        return this.historyRepository.save(history)
      case HistoryType.MoneyServerTransfer:
        history.server = payload;
        history.amount = secondPayload;

        return this.historyRepository.save(history)
    }
  }
}