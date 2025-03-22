import fs from 'fs'
import path from 'path'

export async function writeJsonFile(filePath, newData, merge = true) {
    try {
        let existingData = {}
        if (merge && fs.existsSync(filePath)) {
            const fileContent = await fs.promises.readFile(filePath, 'utf-8')
            existingData = JSON.parse(fileContent)
        }
        const updatedData = { ...existingData, ...newData }
        await fs.promises.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf-8')
    } catch (error) {
        logger.error(`配置文件更新失败：${error.message}..`)
    }
}