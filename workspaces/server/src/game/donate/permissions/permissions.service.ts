import { MomentWrapper } from '@common';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { HistoryType } from 'src/game/cabinet/history/enums/history-type.enum';
import { HistoryService } from 'src/game/cabinet/history/history.service';
import { Server } from 'src/game/servers/entities/server.entity';
import { In, Repository } from 'typeorm';
import { Period } from '../entities/period.entity';
import { GroupKit } from '../groups/entities/group-kit.entity';
import { PermissionBuyInput } from './dto/permission-buy.input';
import { PermissionInput } from './dto/permission.input';
import { DonatePermission } from './entities/donate-permission.entity';
import { UsersDonatePermission } from './entities/user-permission.entity';
import { PermissionType } from './enums/permission-type.enum';

@Injectable()
export class DonatePermissionsService {
  constructor(
    private historyService: HistoryService,
    @Inject('moment')
    private moment: MomentWrapper,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UsersDonatePermission)
    private userPermissionsRepository: Repository<UsersDonatePermission>,
    @InjectRepository(DonatePermission)
    private donatePermissionsRepository: Repository<DonatePermission>,
    @InjectRepository(Server)
    private serversRepository: Repository<Server>,
    @InjectRepository(Period)
    private periodsRepository: Repository<Period>,
    @InjectRepository(GroupKit)
    private groupKitsRepository: Repository<GroupKit>,
  ) { }

  find(relations: string[] = new Array()): Promise<DonatePermission[]> {
    return this.donatePermissionsRepository.find({ relations });
  }

  me(user: User): Promise<UsersDonatePermission[]> {
    return this.userPermissionsRepository.find({ user: { uuid: user.uuid } });
  }

  async buy(user: User, ip: string, input: PermissionBuyInput) {
    const permission = await this.findOne(input.permission, ['servers', 'periods'])
    const server = permission?.servers?.find(server => server.id == input.server)
    const period = permission?.periods?.find(period => period.id == input.period)

    if (!permission || !period || !(server || permission.type == PermissionType.Web))
      throw new NotFoundException()


    const price = (permission.price - permission.price * permission.sale / 100) * period.multiplier

    if (user.real < price)
      throw new BadRequestException()

    let userPermission = await this.userPermissionsRepository.findOne({
      user: {
        uuid: user.uuid
      },
      server: permission.type == PermissionType.Web ? null : {
        id: server.id
      },
      permission: {
        id: permission.id
      }
    })

    if (userPermission) {
      if (!userPermission.expired)
        throw new BadRequestException()

      userPermission.gived = null
      userPermission.expired = period.expire ? this.moment(userPermission.expired).utc().add(period.expire, 'seconds').toDate() : null
    } else {
      userPermission = new UsersDonatePermission()
      userPermission.expired = period.expire ? this.moment().utc().add(period.expire, 'seconds').toDate() : null
      userPermission.server = server
      userPermission.permission = permission
      userPermission.user = user
    }

    user.real = user.real - price

    await this.historyService.create(HistoryType.DonatePermissionPurchase, ip, user, permission, server, period);
    await this.userPermissionsRepository.save(userPermission)
    await this.usersRepository.save(user)
  }

  async findByServer(id: string) {
    const perms = await this.donatePermissionsRepository.find({
      relations: ['servers', 'periods'],
      order: {
        type: 'DESC'
      },
      where: (qb) => {
        qb.where('server_id = :id', { id }).orWhere('type = :type', { type: PermissionType.Web })
      },
    });

    return perms.filter(perm => perm.periods.length)
  }

  findOne(id: number, relations?: string[]): Promise<DonatePermission> {
    return this.donatePermissionsRepository.findOne(id, { relations });
  }

  async create(input: PermissionInput) {
    const perm = new DonatePermission();

    perm.name = input.name;
    perm.type = input.type;
    perm.description = input.description;
    perm.price = input.price;
    perm.sale = input.sale;

    perm.periods = await this.periodsRepository.find({
      id: In(input.periods),
    });

    perm.perms = [];
    perm.servers = [];
    perm.web_perms = [];
    perm.kits = [];
    perm.servers = [];

    switch (input.type) {
      case PermissionType.Game:
        perm.perms = input.perms;
        perm.servers = await this.serversRepository.find({
          id: In(input.servers),
        });
        break;
      case PermissionType.Web:
        perm.web_perms = input.web_perms;
        break;
      case PermissionType.Kit:
        perm.perms = input.perms;
        perm.kits = await this.groupKitsRepository.find({
          id: In(input.kits),
        });
        perm.servers = await this.serversRepository.find({
          id: In(input.servers),
        });
        break;
    }

    return this.donatePermissionsRepository.save(perm);
  }

  async update(id: number, input: PermissionInput) {
    const perm = await this.findOne(id);

    if (!perm) {
      throw new NotFoundException();
    }

    perm.name = input.name;
    perm.description = input.description;
    perm.price = input.price;
    perm.sale = input.sale;

    perm.periods = await this.periodsRepository.find({
      id: In(input.periods),
    });

    perm.perms = [];
    perm.servers = [];
    perm.web_perms = [];
    perm.kits = [];
    perm.servers = [];

    switch (input.type) {
      case PermissionType.Game:
        perm.perms = input.perms;
        perm.servers = await this.serversRepository.find({
          id: In(input.servers),
        });
        break;
      case PermissionType.Web:
        perm.web_perms = input.web_perms;
        break;
      case PermissionType.Kit:
        perm.perms = input.perms;
        perm.kits = await this.groupKitsRepository.find({
          id: In(input.kits),
        });
        perm.servers = await this.serversRepository.find({
          id: In(input.servers),
        });
        break;
    }

    return this.donatePermissionsRepository.save(perm);
  }

  async remove(id: number) {
    const perm = await this.findOne(id);

    if (!perm) {
      throw new NotFoundException();
    }

    return this.donatePermissionsRepository.remove(perm);
  }

  async removeMany(ids: number[]) {
    const perms = await this.donatePermissionsRepository.find({
      where: {
        id: In(ids),
      },
    });

    return this.donatePermissionsRepository.remove(perms);
  }
}