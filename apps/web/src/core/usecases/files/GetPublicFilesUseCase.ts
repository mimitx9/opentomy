import type { IFileRepository, ListFilesResult } from '../../ports/outbound/repositories/IFileRepository'

export interface GetPublicFilesInput {
  page: number
  limit: number
  search?: string
}

export interface GetPublicFilesOutput extends ListFilesResult {
  hasMore: boolean
}

export class GetPublicFilesUseCase {
  constructor(private readonly fileRepo: IFileRepository) {}

  async execute(input: GetPublicFilesInput): Promise<GetPublicFilesOutput> {
    const limit = Math.min(input.limit, 50)
    const { files, total } = await this.fileRepo.findMany({
      isPublic: true,
      search: input.search,
      page: input.page,
      limit,
    })

    return { files, total, hasMore: total > input.page * limit }
  }
}
