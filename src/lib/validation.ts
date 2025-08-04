// 共通バリデーションヘルパー

// 共通のバリデーションパターン
export const ValidationPatterns = {
  // カタカナのみ（スペース含む）
  KATAKANA: /^[\u30A0-\u30FF\s]+$/,
  // メールアドレス
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // 電話番号（数字とハイフン）
  PHONE: /^[\d-]+$/,
  // 日本の電話番号（より厳密）
  JAPAN_PHONE: /^0\d{1,4}-?\d{1,4}-?\d{4}$/,
  // URL
  URL: /^https?:\/\/.+$/,
  // 郵便番号
  POSTAL_CODE: /^\d{3}-?\d{4}$/,
  // 数字のみ
  NUMERIC: /^\d+$/,
  // 英数字のみ
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  // 日本語文字（ひらがな、カタカナ、漢字）
  JAPANESE: /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/
} as const

// 共通のバリデーションメッセージ
export const ValidationMessages = {
  REQUIRED: 'この項目は必須です',
  KATAKANA: 'カタカナで入力してください',
  EMAIL: '正しいメールアドレスを入力してください',
  PHONE: '電話番号は数字とハイフンのみで入力してください',
  JAPAN_PHONE: '正しい電話番号を入力してください（例: 090-1234-5678）',
  URL: '正しいURLを入力してください',
  POSTAL_CODE: '正しい郵便番号を入力してください（例: 123-4567）',
  NUMERIC: '数字のみで入力してください',
  ALPHANUMERIC: '英数字のみで入力してください',
  MIN_LENGTH: (min: number) => `${min}文字以上入力してください`,
  MAX_LENGTH: (max: number) => `${max}文字以内で入力してください`,
  MIN_VALUE: (min: number) => `${min}以上の値を入力してください`,
  MAX_VALUE: (max: number) => `${max}以下の値を入力してください`
} as const

// バリデーション関数の型
export type ValidatorFunction = (value: unknown) => boolean | string

// 共通のバリデーター
export const Validators = {
  // 必須チェック
  required: (message: string = ValidationMessages.REQUIRED): ValidatorFunction => {
    return (value: unknown) => {
      if (value === null || value === undefined || value === '') {
        return message
      }
      if (typeof value === 'string' && value.trim() === '') {
        return message
      }
      return true
    }
  },

  // パターンマッチング
  pattern: (pattern: RegExp, message: string): ValidatorFunction => {
    return (value: unknown) => {
      if (!value) return true // 空の場合はパターンチェックをスキップ
      const strValue = String(value)
      if (!pattern.test(strValue)) {
        return message
      }
      return true
    }
  },

  // カタカナチェック
  katakana: (message: string = ValidationMessages.KATAKANA): ValidatorFunction => {
    return Validators.pattern(ValidationPatterns.KATAKANA, message)
  },

  // メールアドレスチェック
  email: (message: string = ValidationMessages.EMAIL): ValidatorFunction => {
    return Validators.pattern(ValidationPatterns.EMAIL, message)
  },

  // 電話番号チェック
  phone: (message: string = ValidationMessages.PHONE): ValidatorFunction => {
    return Validators.pattern(ValidationPatterns.PHONE, message)
  },

  // 日本の電話番号チェック（より厳密）
  japanPhone: (message: string = ValidationMessages.JAPAN_PHONE): ValidatorFunction => {
    return Validators.pattern(ValidationPatterns.JAPAN_PHONE, message)
  },

  // 最小文字数
  minLength: (min: number, message?: string): ValidatorFunction => {
    return (value: unknown) => {
      if (!value) return true
      const strValue = String(value)
      if (strValue.length < min) {
        return message || ValidationMessages.MIN_LENGTH(min)
      }
      return true
    }
  },

  // 最大文字数
  maxLength: (max: number, message?: string): ValidatorFunction => {
    return (value: unknown) => {
      if (!value) return true
      const strValue = String(value)
      if (strValue.length > max) {
        return message || ValidationMessages.MAX_LENGTH(max)
      }
      return true
    }
  },

  // 数値の最小値
  minValue: (min: number, message?: string): ValidatorFunction => {
    return (value: unknown) => {
      if (value === null || value === undefined || value === '') return true
      const numValue = Number(value)
      if (isNaN(numValue) || numValue < min) {
        return message || ValidationMessages.MIN_VALUE(min)
      }
      return true
    }
  },

  // 数値の最大値
  maxValue: (max: number, message?: string): ValidatorFunction => {
    return (value: unknown) => {
      if (value === null || value === undefined || value === '') return true
      const numValue = Number(value)
      if (isNaN(numValue) || numValue > max) {
        return message || ValidationMessages.MAX_VALUE(max)
      }
      return true
    }
  },

  // 数値のみ
  numeric: (message: string = ValidationMessages.NUMERIC): ValidatorFunction => {
    return Validators.pattern(ValidationPatterns.NUMERIC, message)
  },

  // 複数のバリデーターを組み合わせる
  compose: (...validators: ValidatorFunction[]): ValidatorFunction => {
    return (value: unknown) => {
      for (const validator of validators) {
        const result = validator(value)
        if (result !== true) {
          return result
        }
      }
      return true
    }
  },

  // 条件付きバリデーション
  when: (
    condition: (formData: Record<string, unknown>) => boolean,
    validator: ValidatorFunction
  ): ValidatorFunction => {
    return (value: unknown, formData?: Record<string, unknown>) => {
      if (formData && condition(formData)) {
        return validator(value)
      }
      return true
    }
  }
}

// よく使うバリデーションルールのプリセット
export const ValidationPresets = {
  // 名前（必須）
  name: {
    required: true,
    maxLength: 50
  },

  // フリガナ（必須、カタカナ）
  nameKana: {
    required: true,
    maxLength: 50,
    custom: Validators.compose(
      Validators.required('フリガナは必須です'),
      Validators.katakana()
    )
  },

  // メールアドレス（必須）
  email: {
    required: true,
    custom: Validators.compose(
      Validators.required('メールアドレスは必須です'),
      Validators.email()
    )
  },

  // 電話番号（必須）
  phone: {
    required: true,
    custom: Validators.compose(
      Validators.required('電話番号は必須です'),
      Validators.japanPhone()
    )
  },

  // オプショナルなテキスト
  optionalText: (maxLength = 200) => ({
    maxLength,
    required: false
  }),

  // 必須のテキスト
  requiredText: (maxLength = 200) => ({
    required: true,
    maxLength
  }),

  // URL（オプショナル）
  url: {
    required: false,
    custom: Validators.pattern(ValidationPatterns.URL, 'URLの形式が正しくありません')
  },

  // ファイル選択（必須）
  requiredFile: (message = 'ファイルを選択してください') => ({
    required: true,
    custom: (value: unknown) => {
      if (!value) return message
      return true
    }
  })
}