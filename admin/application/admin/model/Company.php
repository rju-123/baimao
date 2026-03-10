<?php

namespace app\admin\model;

use think\Model;

/**
 * 公司
 */
class Company extends Model
{
    protected $name = 'company';

    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';

    protected $append = [];
}
