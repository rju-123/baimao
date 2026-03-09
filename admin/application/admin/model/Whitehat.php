<?php

namespace app\admin\model;

use think\Model;

/**
 * 白帽子（接单员）
 */
class Whitehat extends Model
{
    protected $name = 'whitehat';

    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';

    /** 软删除字段 */
    protected $deleteTime = 'deletetime';

    protected $append = [];

    /**
     * 全局查询范围：仅未删除
     */
    public function base($query)
    {
        $query->where('deletetime', 'null');
    }

    /**
     * 软删除：设置 deletetime，不物理删除
     */
    public function delete($data = null, $force = false)
    {
        if ($force) {
            return parent::delete($data);
        }
        $this->deletetime = time();
        $this->save();
        return 1;
    }

    /**
     * 生成下一个白帽子编号 H001, H002, ...（按全表 id 递增，含已软删记录，避免重复）
     */
    public static function generateNextCode()
    {
        $maxId = \think\Db::name('whitehat')->max('id');
        $seq = intval($maxId) + 1;
        return 'H' . str_pad((string)$seq, 3, '0', STR_PAD_LEFT);
    }
}
